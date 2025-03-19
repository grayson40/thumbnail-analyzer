/**
 * YouTube Thumbnail Analysis Pipeline
 * 
 * This script:
 * 1. Collects metadata from popular YouTube videos
 * 2. Downloads thumbnails
 * 3. Analyzes them with Cloud Vision API
 * 4. Extracts patterns and metrics
 * 5. Generates a scoring model based on findings
 */

const dotenv = require('dotenv');
// Load environment variables from .env.local as well
dotenv.config({ path: '.env' });
dotenv.config();

const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const vision = require('@google-cloud/vision');
const { createCanvas, loadImage } = require('canvas');
const { parse } = require('json2csv');

// Initialize APIs
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Check if API key is set
if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY is not set in environment variables');
    console.error('Please set your YouTube API key in a .env file or environment');
    process.exit(1);
}

// Initialize Vision client with the correct credentials
let visionClient;
try {
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
        // Check if it's a path to a JSON file
        if (process.env.GOOGLE_CLOUD_VISION_API_KEY.endsWith('.json')) {
            visionClient = new vision.ImageAnnotatorClient({
                keyFilename: process.env.GOOGLE_CLOUD_VISION_API_KEY
            });
            console.log(`Using Vision API credentials from file: ${process.env.GOOGLE_CLOUD_VISION_API_KEY}`);
        }
        // Check if it's a Base64 encoded JSON
        else if (process.env.GOOGLE_CLOUD_VISION_API_KEY.includes('ewog')) {
            try {
                const credentialsJSON = Buffer.from(process.env.GOOGLE_CLOUD_VISION_API_KEY, 'base64').toString();
                const credentials = JSON.parse(credentialsJSON);
                visionClient = new vision.ImageAnnotatorClient({
                    credentials: credentials,
                    projectId: credentials.project_id,
                });
                console.log('Using Base64 encoded Vision API credentials');
            } catch (error) {
                console.error('Error parsing Base64 credentials:', error);
                process.exit(1);
            }
        }
        // Otherwise, try to use it directly
        else {
            visionClient = new vision.ImageAnnotatorClient();
            console.log('Using default Vision API credentials');
        }
    } else {
        console.error('Error: GOOGLE_CLOUD_VISION_API_KEY is not set in environment variables');
        process.exit(1);
    }
} catch (error) {
    console.error('Error initializing Vision client:', error);
    process.exit(1);
}

// Configuration
const CATEGORIES = [
    { id: '20', name: 'Gaming' },
    { id: '24', name: 'Entertainment' },
    { id: '10', name: 'Music' },
    { id: '23', name: 'Comedy' },
    { id: '22', name: 'People & Blogs' },
    { id: '28', name: 'Science & Technology' }
];

// Reduce sample size for testing
const SAMPLE_SIZE_PER_CATEGORY = 10; // Reduced from 50 to 10 for faster testing
const MIN_VIEW_COUNT = 1000000; // Only videos with at least 1M views
const DATA_DIR = './data';
const THUMBNAILS_DIR = path.join(DATA_DIR, 'thumbnails');
const ANALYSIS_DIR = path.join(DATA_DIR, 'analysis');

// Create necessary directories
async function setupDirectories() {
    for (const dir of [DATA_DIR, THUMBNAILS_DIR, ANALYSIS_DIR]) {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Fetch popular videos from YouTube by category with compensation for filtering
async function fetchPopularVideos(categoryId) {
    try {
        // Request more videos than needed to account for filtering
        const initialRequestSize = SAMPLE_SIZE_PER_CATEGORY * 3; // Request 3x the desired amount

        const response = await youtube.videos.list({
            part: 'snippet,statistics,contentDetails',
            chart: 'mostPopular',
            videoCategoryId: categoryId,
            maxResults: Math.min(initialRequestSize, 50), // YouTube API max is 50
            regionCode: 'US'
        });

        // Filter out shorts and low-view videos
        const filteredVideos = response.data.items.filter(video => {
            // Filter out videos with less than minimum views
            if (parseInt(video.statistics.viewCount) < MIN_VIEW_COUNT) return false;

            // Filter out Shorts
            const duration = video.contentDetails.duration;
            const durationInSeconds = parseDuration(duration);
            const isShortDuration = durationInSeconds <= 60;

            const hasShortIndicator =
                (video.snippet.thumbnailUrl && video.snippet.thumbnailUrl.includes('/shorts/')) ||
                (video.snippet.title && video.snippet.title.toLowerCase().includes('#shorts')) ||
                (video.snippet.description && video.snippet.description.toLowerCase().includes('#shorts'));

            return !(isShortDuration && hasShortIndicator);
        });

        // If we don't have enough videos, make additional requests
        let allFilteredVideos = [...filteredVideos];
        let pageToken = response.data.nextPageToken;

        while (allFilteredVideos.length < SAMPLE_SIZE_PER_CATEGORY && pageToken) {
            const additionalResponse = await youtube.videos.list({
                part: 'snippet,statistics,contentDetails',
                chart: 'mostPopular',
                videoCategoryId: categoryId,
                maxResults: 50,
                regionCode: 'US',
                pageToken: pageToken
            });

            const additionalFilteredVideos = additionalResponse.data.items.filter(video => {
                // Same filtering logic as above
                if (parseInt(video.statistics.viewCount) < MIN_VIEW_COUNT) return false;

                const duration = video.contentDetails.duration;
                const durationInSeconds = parseDuration(duration);
                const isShortDuration = durationInSeconds <= 60;

                const hasShortIndicator =
                    (video.snippet.thumbnailUrl && video.snippet.thumbnailUrl.includes('/shorts/')) ||
                    (video.snippet.title && video.snippet.title.toLowerCase().includes('#shorts')) ||
                    (video.snippet.description && video.snippet.description.toLowerCase().includes('#shorts'));

                return !(isShortDuration && hasShortIndicator);
            });

            allFilteredVideos = [...allFilteredVideos, ...additionalFilteredVideos];
            pageToken = additionalResponse.data.nextPageToken;

            // Break if we've made several requests but still don't have enough videos
            // This prevents too many API calls if a category has few non-Shorts videos
            if (allFilteredVideos.length < SAMPLE_SIZE_PER_CATEGORY && allFilteredVideos.length === filteredVideos.length) {
                console.log(`Could only find ${allFilteredVideos.length} non-Shorts videos for category ${categoryId} after multiple requests`);
                break;
            }
        }

        // Now take exactly the sample size we want (or all if we couldn't get enough)
        return allFilteredVideos.slice(0, SAMPLE_SIZE_PER_CATEGORY).map(video => ({
            id: video.id,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            categoryId: video.snippet.categoryId,
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount),
            likeCount: parseInt(video.statistics.likeCount || 0),
            commentCount: parseInt(video.statistics.commentCount || 0),
            thumbnailUrl: video.snippet.thumbnails.high.url,
            duration: video.contentDetails.duration,
            ctr: calculateEstimatedCTR(video.statistics)
        }));
    } catch (error) {
        console.error(`Error fetching videos for category ${categoryId}:`, error.message);
        return [];
    }
}

// Helper function to parse ISO 8601 duration to seconds
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

// Calculate an estimated CTR (this is a proxy since actual CTR isn't publicly available)
function calculateEstimatedCTR(statistics) {
    // This is a simplified heuristic - in reality, CTR calculation would be more complex
    // We're using engagement (likes + comments) as a percentage of views as a proxy
    const engagement = (parseInt(statistics.likeCount || 0) + parseInt(statistics.commentCount || 0));
    const views = parseInt(statistics.viewCount);
    return ((engagement / views) * 100).toFixed(2);
}

// Download thumbnail for a video
async function downloadThumbnail(videoId, thumbnailUrl) {
    try {
        const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
        const thumbnailPath = path.join(THUMBNAILS_DIR, `${videoId}.jpg`);
        await fs.writeFile(thumbnailPath, response.data);
        return thumbnailPath;
    } catch (error) {
        console.error(`Error downloading thumbnail for ${videoId}:`, error.message);
        return null;
    }
}

// Analyze thumbnail with Google Cloud Vision
async function analyzeThumbnail(thumbnailPath) {
    try {
        const [textDetection] = await visionClient.textDetection(thumbnailPath);
        const [imageProperties] = await visionClient.imageProperties(thumbnailPath);
        const [faceDetection] = await visionClient.faceDetection(thumbnailPath);
        const [objectLocalization] = await visionClient.objectLocalization(thumbnailPath);
        const [safeSearch] = await visionClient.safeSearchDetection(thumbnailPath);

        return {
            text: textDetection.textAnnotations[0]?.description || '',
            textEntities: textDetection.textAnnotations.length - 1, // Subtract the full-text entity
            textCharCount: textDetection.textAnnotations[0]?.description.length || 0,
            hasText: textDetection.textAnnotations.length > 0,
            dominantColors: extractDominantColors(imageProperties),
            colorScore: calculateColorScore(imageProperties),
            faceCount: faceDetection.faceAnnotations.length,
            hasFace: faceDetection.faceAnnotations.length > 0,
            emotions: extractEmotions(faceDetection),
            faceCoverage: calculateFaceCoverage(faceDetection, thumbnailPath),
            objectCount: objectLocalization.localizedObjectAnnotations.length,
            objects: extractObjects(objectLocalization),
            safeSearchRatings: safeSearch.safeSearchAnnotation
        };
    } catch (error) {
        console.error(`Error analyzing thumbnail:`, error.message);
        return null;
    }
}

// Extract dominant colors from Vision API results
function extractDominantColors(imageProperties) {
    return imageProperties.imagePropertiesAnnotation.dominantColors.colors
        .slice(0, 5)
        .map(color => ({
            color: {
                red: color.color.red,
                green: color.color.green,
                blue: color.color.blue
            },
            score: color.score,
            pixelFraction: color.pixelFraction,
            hex: rgbToHex(color.color.red, color.color.green, color.color.blue)
        }));
}

// Calculate color score based on contrast, vibrancy, and color harmony
function calculateColorScore(imageProperties) {
    const colors = imageProperties.imagePropertiesAnnotation.dominantColors.colors;

    // Measure color contrast between the two most dominant colors
    let contrastScore = 0;
    if (colors.length >= 2) {
        const color1 = colors[0].color;
        const color2 = colors[1].color;
        contrastScore = calculateColorContrast(color1, color2) / 21 * 100; // Normalize to 0-100
    }

    // Measure color vibrancy (saturation and brightness)
    const vibrancyScore = colors.slice(0, 3).reduce((sum, colorObj) => {
        const color = colorObj.color;
        const saturation = calculateSaturation(color);
        return sum + (saturation * colorObj.score);
    }, 0) * 100;

    // Composite score (weighting can be adjusted based on findings)
    return Math.round((contrastScore * 0.6) + (vibrancyScore * 0.4));
}

// Calculate contrast between two colors (WCAG algorithm)
function calculateColorContrast(color1, color2) {
    const luminance1 = calculateLuminance(color1);
    const luminance2 = calculateLuminance(color2);

    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);

    return (brightest + 0.05) / (darkest + 0.05);
}

// Calculate luminance for a color
function calculateLuminance(color) {
    const r = color.red / 255;
    const g = color.green / 255;
    const b = color.blue / 255;

    const r1 = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const g1 = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const b1 = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
}

// Calculate saturation for a color
function calculateSaturation(color) {
    const r = color.red / 255;
    const g = color.green / 255;
    const b = color.blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (max === 0) {
        return 0; // Avoid division by zero
    }

    return delta / max;
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Extract emotions from face detection
function extractEmotions(faceDetection) {
    return faceDetection.faceAnnotations.map(face => ({
        joy: face.joyLikelihood,
        sorrow: face.sorrowLikelihood,
        anger: face.angerLikelihood,
        surprise: face.surpriseLikelihood
    }));
}

// Calculate the percentage of the image covered by faces
async function calculateFaceCoverage(faceDetection, thumbnailPath) {
    if (faceDetection.faceAnnotations.length === 0) {
        return 0;
    }

    try {
        const image = await loadImage(thumbnailPath);
        const imageArea = image.width * image.height;

        let totalFaceArea = 0;
        for (const face of faceDetection.faceAnnotations) {
            const vertices = face.boundingPoly.vertices;
            const width = Math.abs(vertices[1].x - vertices[0].x);
            const height = Math.abs(vertices[2].y - vertices[0].y);
            totalFaceArea += width * height;
        }

        return (totalFaceArea / imageArea) * 100;
    } catch (error) {
        console.error('Error calculating face coverage:', error.message);
        return 0;
    }
}

// Extract objects from object localization
function extractObjects(objectLocalization) {
    return objectLocalization.localizedObjectAnnotations.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        area: calculateObjectArea(obj.boundingPoly.normalizedVertices)
    }));
}

// Calculate normalized object area
function calculateObjectArea(vertices) {
    // Normalized vertices are in range [0, 1]
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[0].y);
    return width * height * 100; // Return as percentage of image
}

// Calculate text metrics
function calculateTextMetrics(textAnnotation, thumbnailPath) {
    if (!textAnnotation || !textAnnotation.textAnnotations || textAnnotation.textAnnotations.length === 0) {
        return {
            textCoverage: 0,
            wordCount: 0,
            averageWordLength: 0
        };
    }

    const text = textAnnotation.textAnnotations[0].description;
    const words = text.split(/\s+/).filter(word => word.length > 0);

    return {
        wordCount: words.length,
        averageWordLength: words.length > 0 ?
            words.reduce((sum, word) => sum + word.length, 0) / words.length : 0,
        textContent: text
    };
}

// Main execution flow
async function main() {
    try {
        await setupDirectories();

        const allVideoData = [];
        const allThumbnailAnalysis = [];

        // Process each category
        for (const category of CATEGORIES) {
            console.log(`Fetching videos for category: ${category.name}`);
            const videos = await fetchPopularVideos(category.id);
            console.log(`Found ${videos.length} videos for analysis`);

            // Process each video
            for (const video of videos) {
                console.log(`Processing video: ${video.id} - ${video.title}`);

                // Download thumbnail
                const thumbnailPath = await downloadThumbnail(video.id, video.thumbnailUrl);
                if (!thumbnailPath) continue;

                // Analyze thumbnail
                const analysis = await analyzeThumbnail(thumbnailPath);
                if (!analysis) continue;

                // Store result
                const result = {
                    ...video,
                    analysis,
                    categoryName: category.name
                };

                allVideoData.push(video);
                allThumbnailAnalysis.push(result);
            }
        }

        // Save results
        await fs.writeFile(
            path.join(DATA_DIR, 'videos.json'),
            JSON.stringify(allVideoData, null, 2)
        );

        await fs.writeFile(
            path.join(ANALYSIS_DIR, 'thumbnail_analysis.json'),
            JSON.stringify(allThumbnailAnalysis, null, 2)
        );

        // Export as CSV for easier analysis
        if (allThumbnailAnalysis.length > 0) {
            const csv = parse(allThumbnailAnalysis.map(item => ({
                videoId: item.id,
                title: item.title,
                viewCount: item.viewCount,
                estimatedCTR: item.ctr,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                hasText: item.analysis.hasText,
                textCharCount: item.analysis.textCharCount,
                textEntities: item.analysis.textEntities,
                hasFace: item.analysis.hasFace,
                faceCount: item.analysis.faceCount,
                faceCoverage: item.analysis.faceCoverage,
                objectCount: item.analysis.objectCount,
                colorScore: item.analysis.colorScore,
                dominantColorHex: item.analysis.dominantColors[0]?.hex
            })));

            await fs.writeFile(
                path.join(ANALYSIS_DIR, 'thumbnail_analysis.csv'),
                csv
            );
        } else {
            console.log('No thumbnail analysis data to export to CSV');
        }

        // Generate aggregate statistics and findings
        await generateInsightsReport(allThumbnailAnalysis);

        console.log('Analysis complete!');
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

// Generate insights report based on analysis data
async function generateInsightsReport(thumbnailData) {
    // Check if we have data to analyze
    if (thumbnailData.length === 0) {
        console.log('No thumbnail data available for analysis. Generating default scoring model instead.');

        // Generate a default scoring model
        const defaultModel = {
            weights: {
                textPresence: 0.2,
                facePresence: 0.2,
                faceCoverage: 0.15,
                colorScore: 0.25,
                textEntities: 0.1,
                objectCount: 0.1
            },
            thresholds: {
                textPresence: true,
                facePresence: true,
                faceCoverage: 20, // percentage
                colorScore: 70,   // 0-100 scale
                textEntities: 3,  // text elements
                objectCount: 3    // visible objects
            },
            categorySpecific: {}
        };

        // Save default scoring model
        await fs.writeFile(
            path.join(ANALYSIS_DIR, 'scoring_model.json'),
            JSON.stringify(defaultModel, null, 2)
        );

        return;
    }

    // Group by category
    const byCategory = {};
    CATEGORIES.forEach(category => {
        byCategory[category.name] = thumbnailData.filter(item => item.categoryName === category.name);
    });

    // Overall statistics across all categories
    const overall = calculateStats(thumbnailData);

    // Category-specific statistics
    const categoryStats = {};
    for (const [category, data] of Object.entries(byCategory)) {
        if (data.length > 0) {
            categoryStats[category] = calculateStats(data);
        }
    }

    // High-CTR vs Low-CTR comparison (using estimated CTR)
    const sortedByCTR = [...thumbnailData].sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr));

    // Make sure we have enough data for quartiles
    const quartileSize = Math.max(1, Math.floor(sortedByCTR.length / 4));
    const topQuartile = sortedByCTR.slice(0, quartileSize);
    const bottomQuartile = sortedByCTR.slice(-quartileSize);

    const highCTRStats = calculateStats(topQuartile);
    const lowCTRStats = calculateStats(bottomQuartile);

    // Compile findings
    const findings = {
        overall,
        byCategory: categoryStats,
        comparison: {
            highCTR: highCTRStats,
            lowCTR: lowCTRStats,
            differences: calculateDifferences(highCTRStats, lowCTRStats)
        }
    };

    // Save findings
    await fs.writeFile(
        path.join(ANALYSIS_DIR, 'findings.json'),
        JSON.stringify(findings, null, 2)
    );

    // Generate scoring model based on findings
    const scoringModel = generateScoringModel(findings);
    await fs.writeFile(
        path.join(ANALYSIS_DIR, 'scoring_model.json'),
        JSON.stringify(scoringModel, null, 2)
    );
}

// Calculate statistics for a dataset
function calculateStats(data) {
    const stats = {
        count: data.length,
        textStats: {
            withText: data.filter(item => item.analysis.hasText).length,
            withTextPercentage: (data.filter(item => item.analysis.hasText).length / data.length) * 100,
            avgTextEntities: average(data.map(item => item.analysis.textEntities)),
            avgCharCount: average(data.map(item => item.analysis.textCharCount))
        },
        faceStats: {
            withFaces: data.filter(item => item.analysis.hasFace).length,
            withFacesPercentage: (data.filter(item => item.analysis.hasFace).length / data.length) * 100,
            avgFaceCount: average(data.map(item => item.analysis.faceCount)),
            avgFaceCoverage: average(data.map(item => item.analysis.faceCoverage))
        },
        colorStats: {
            avgColorScore: average(data.map(item => item.analysis.colorScore)),
            mostCommonColorRanges: findMostCommonColorRanges(data)
        },
        objectStats: {
            avgObjectCount: average(data.map(item => item.analysis.objectCount)),
            mostCommonObjects: findMostCommonObjects(data)
        }
    };

    return stats;
}

// Find the most common color ranges
function findMostCommonColorRanges(data) {
    const colorCounts = {};

    data.forEach(item => {
        if (!item.analysis.dominantColors || item.analysis.dominantColors.length === 0) return;

        const mainColor = item.analysis.dominantColors[0].color;
        const colorRange = categorizeColor(mainColor);

        colorCounts[colorRange] = (colorCounts[colorRange] || 0) + 1;
    });

    return Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([range, count]) => ({
            range,
            count,
            percentage: (count / data.length) * 100
        }));
}

// Categorize a color into a named range
function categorizeColor(color) {
    const r = color.red;
    const g = color.green;
    const b = color.blue;

    // Simple categorization
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > 200 && g < 100 && b < 100) return 'red';
    if (r < 100 && g > 200 && b < 100) return 'green';
    if (r < 100 && g < 100 && b > 200) return 'blue';
    if (r > 200 && g > 200 && b < 100) return 'yellow';

    return 'other';
}

// Find most common objects in thumbnails
function findMostCommonObjects(data) {
    const objectCounts = {};

    data.forEach(item => {
        if (!item.analysis.objects) return;

        item.analysis.objects.forEach(obj => {
            objectCounts[obj.name] = (objectCounts[obj.name] || 0) + 1;
        });
    });

    return Object.entries(objectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({
            name,
            count,
            percentage: (count / data.length) * 100
        }));
}

// Calculate the average of an array of numbers
function average(numbers) {
    const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
    if (validNumbers.length === 0) return 0;
    return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
}

// Calculate key differences between high and low CTR thumbnails
function calculateDifferences(highCTRStats, lowCTRStats) {
    return {
        textPresence: {
            difference: highCTRStats.textStats.withTextPercentage - lowCTRStats.textStats.withTextPercentage,
            highCTR: highCTRStats.textStats.withTextPercentage,
            lowCTR: lowCTRStats.textStats.withTextPercentage
        },
        facePresence: {
            difference: highCTRStats.faceStats.withFacesPercentage - lowCTRStats.faceStats.withFacesPercentage,
            highCTR: highCTRStats.faceStats.withFacesPercentage,
            lowCTR: lowCTRStats.faceStats.withFacesPercentage
        },
        faceCoverage: {
            difference: highCTRStats.faceStats.avgFaceCoverage - lowCTRStats.faceStats.avgFaceCoverage,
            highCTR: highCTRStats.faceStats.avgFaceCoverage,
            lowCTR: lowCTRStats.faceStats.avgFaceCoverage
        },
        colorScore: {
            difference: highCTRStats.colorStats.avgColorScore - lowCTRStats.colorStats.avgColorScore,
            highCTR: highCTRStats.colorStats.avgColorScore,
            lowCTR: lowCTRStats.colorStats.avgColorScore
        },
        textEntities: {
            difference: highCTRStats.textStats.avgTextEntities - lowCTRStats.textStats.avgTextEntities,
            highCTR: highCTRStats.textStats.avgTextEntities,
            lowCTR: lowCTRStats.textStats.avgTextEntities
        },
        objectCount: {
            difference: highCTRStats.objectStats.avgObjectCount - lowCTRStats.objectStats.avgObjectCount,
            highCTR: highCTRStats.objectStats.avgObjectCount,
            lowCTR: lowCTRStats.objectStats.avgObjectCount
        }
    };
}

// Generate a scoring model based on the findings
function generateScoringModel(findings) {
    const { comparison } = findings;
    const { differences } = comparison;

    // Determine scoring weights based on the magnitude of differences
    // between high and low CTR thumbnails
    const weights = {
        textPresence: normalizeWeight(Math.abs(differences.textPresence.difference)),
        facePresence: normalizeWeight(Math.abs(differences.facePresence.difference)),
        faceCoverage: normalizeWeight(Math.abs(differences.faceCoverage.difference)),
        colorScore: normalizeWeight(Math.abs(differences.colorScore.difference)),
        textEntities: normalizeWeight(Math.abs(differences.textEntities.difference)),
        objectCount: normalizeWeight(Math.abs(differences.objectCount.difference))
    };

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    for (const key in weights) {
        weights[key] = weights[key] / totalWeight;
    }

    // Create scoring thresholds based on high CTR stats
    const thresholds = {
        textPresence: comparison.highCTR.textStats.withTextPercentage > 50,
        facePresence: comparison.highCTR.faceStats.withFacesPercentage > 50,
        faceCoverage: comparison.highCTR.faceStats.avgFaceCoverage,
        colorScore: comparison.highCTR.colorStats.avgColorScore,
        textEntities: comparison.highCTR.textStats.avgTextEntities,
        objectCount: comparison.highCTR.objectStats.avgObjectCount
    };

    return {
        weights,
        thresholds,
        categorySpecific: generateCategorySpecificThresholds(findings.byCategory)
    };
}

// Generate category-specific thresholds
function generateCategorySpecificThresholds(categoryStats) {
    const categoryThresholds = {};

    for (const [category, stats] of Object.entries(categoryStats)) {
        categoryThresholds[category] = {
            textPresence: stats.textStats.withTextPercentage > 50,
            facePresence: stats.faceStats.withFacesPercentage > 50,
            faceCoverage: stats.faceStats.avgFaceCoverage,
            colorScore: stats.colorStats.avgColorScore,
            textEntities: stats.textStats.avgTextEntities,
            objectCount: stats.objectStats.avgObjectCount,
            commonColors: stats.colorStats.mostCommonColorRanges.slice(0, 3),
            commonObjects: stats.objectStats.mostCommonObjects.slice(0, 5)
        };
    }

    return categoryThresholds;
}

// Normalize a weight value between 0.1 and 0.5
function normalizeWeight(value) {
    // Ensure minimum weight of 0.1 for each factor
    return Math.max(0.1, Math.min(0.5, value / 100));
}

// Start the process
main().catch(console.error);