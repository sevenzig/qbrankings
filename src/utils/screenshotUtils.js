import html2canvas from 'html2canvas';
import { getTeamInfo } from '../constants/teamData.js';

/**
 * Preload team logo images to ensure they appear in screenshot
 * @param {Array} qbs - Array of QB data
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
const preloadTeamLogos = async (qbs) => {
  const logoUrls = new Set();
  
  qbs.forEach(qb => {
    const teams = getQBTeams(qb);
    teams.forEach(team => {
      const teamInfo = getTeamInfo(team.team);
      if (teamInfo.logo) {
        logoUrls.add(teamInfo.logo);
      }
    });
  });
  
  const loadPromises = Array.from(logoUrls).map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // Don't fail on logo load errors
      img.src = url;
    });
  });
  
  return Promise.all(loadPromises);
};

/**
 * Takes a screenshot of the top 10 QBs table
 * @param {Array} rankedQBs - Array of ranked quarterback data
 * @param {Object} options - Screenshot options including includePlayoffs, include2024Only
 * @returns {Promise<Object>} - Promise that resolves to {blob, blobUrl}
 */
export const captureTop10QBsScreenshot = async (rankedQBs, options = {}) => {
  console.log('📸 Starting screenshot generation...');
  const { includePlayoffs = true, include2024Only = false } = options;
  
  // Get top 10 QBs
  const top10QBs = rankedQBs.slice(0, 10);
  console.log('📸 Top 10 QBs:', top10QBs.length);
  
  // Extract all QBs with base scores for dynamic tier calculation
  const allQBsWithBaseScores = rankedQBs;
  
  // Preload team logos
  console.log('📸 Preloading team logos...');
  await preloadTeamLogos(top10QBs);
  
  // Create temporary container for screenshot
  const screenshotContainer = document.createElement('div');
  screenshotContainer.id = 'qb-screenshot-container';
  screenshotContainer.style.position = 'absolute';
  screenshotContainer.style.top = '-9999px';
  screenshotContainer.style.left = '-9999px';
  screenshotContainer.style.width = '600px'; // Increased for better readability
  screenshotContainer.style.backgroundColor = '#1e3a8a'; // Blue background similar to app
  screenshotContainer.style.backgroundImage = 'linear-gradient(to bottom right, #1e3a8a, #1e40af, #3730a3)';
  screenshotContainer.style.padding = '20px'; // More padding for better spacing
  screenshotContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  screenshotContainer.style.borderRadius = '12px'; // Add rounded corners
  
  // Generate team logos HTML for all QBs first
  const qbRowsPromises = top10QBs.map(async (qb, index) => {
    const rowBg = getRowBackgroundStyle(index);
    const qeiColor = getQEIColorStyle(qb, allQBsWithBaseScores);
    const qeiLabel = getQEILabel(qb, allQBsWithBaseScores);
    const teamLogosHtml = await getTeamLogosHtml(qb);
    
          return `
        <tr style="${rowBg} border-bottom: 1px solid rgba(255, 255, 255, 0.08); height: 60px;">
        <td style="padding: 8px 12px; width: 60px; vertical-align: middle;">
          <div style="font-size: 16px; font-weight: bold; color: white; text-align: center; line-height: 1;">#${index + 1}</div>
        </td>
        <td style="padding: 8px 12px; width: 200px; vertical-align: middle;">
          <div style="font-weight: bold; color: white; font-size: 16px; line-height: 1.2; margin-bottom: 4px;">${qb.name}</div>
          <div style="font-size: 12px; color: #93c5fd; line-height: 1;">${qb.experience}yr • ${qb.age}</div>
        </td>
        <td style="padding: 8px 12px; text-align: center; width: 100px; vertical-align: middle;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: nowrap; padding-top: 8px; overflow: hidden;">
            ${teamLogosHtml}
          </div>
        </td>
        <td style="padding: 8px 12px; text-align: center; width: 80px; vertical-align: middle;">
          <div style="${qeiColor} display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 8px; border-radius: 6px; text-align: center; width: 100%; box-sizing: border-box;">
            <div style="font-size: 16px; font-weight: bold; line-height: 1; text-align: center; width: 100%;">${qb.qei.toFixed(2)}</div>
            <div style="font-size: 10px; opacity: 0.8; line-height: 1; margin-top: 4px; text-align: center; width: 100%;">
              ${qeiLabel}
            </div>
          </div>
        </td>
      </tr>
    `;
  });
  
  const qbRows = await Promise.all(qbRowsPromises);
  console.log('📸 Generated QB rows:', qbRows.length);
  
  // Create the screenshot content
  console.log('📸 Creating screenshot HTML...');
  screenshotContainer.innerHTML = `
    <div style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(20px); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.15);">
      <!-- Header -->
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.05);">
        <h3 style="font-size: 20px; font-weight: bold; color: white; margin: 0; display: flex; align-items: center; letter-spacing: 0.5px;">
          🏆 QB Rankings (Top ${top10QBs.length})
        </h3>
      </div>
      
      <!-- Table -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
          <thead style="background: rgba(255, 255, 255, 0.08);">
            <tr>
              <th style="padding: 12px; text-align: center; color: #e5e7eb; font-weight: 600; font-size: 14px; width: 60px; letter-spacing: 0.3px;">RANK</th>
              <th style="padding: 12px; text-align: left; color: #e5e7eb; font-weight: 600; font-size: 14px; width: 200px; letter-spacing: 0.3px;">QB</th>
              <th style="padding: 12px; text-align: center; color: #e5e7eb; font-weight: 600; font-size: 14px; width: 100px; letter-spacing: 0.3px;">TEAM</th>
              <th style="padding: 12px; text-align: center; color: #e5e7eb; font-weight: 600; font-size: 14px; width: 80px; letter-spacing: 0.3px;">QEI</th>
            </tr>
          </thead>
          <tbody>
            ${qbRows.join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Add to DOM temporarily
  console.log('📸 Adding container to DOM...');
  document.body.appendChild(screenshotContainer);
  
  // Wait a bit for images to load
  console.log('📸 Waiting for images to load...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Take screenshot with html2canvas
    console.log('📸 Taking screenshot with html2canvas...');
    const canvas = await html2canvas(screenshotContainer, {
      backgroundColor: '#1e3a8a', // Set background color
      scale: 1, // Start with scale 1 for debugging
      useCORS: true,
      allowTaint: true,
      logging: true, // Enable logging to see what's happening
      onclone: (clonedDoc) => {
        console.log('📸 html2canvas cloned document');
        return clonedDoc;
      }
    });
    
    console.log('📸 Canvas created:', canvas.width, 'x', canvas.height);
    
    // Convert to blob URL for display in browser
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        console.log('📸 Blob created:', blob?.size, 'bytes');
        const blobUrl = URL.createObjectURL(blob);
        console.log('📸 Blob URL created:', blobUrl);
        resolve({ blob, blobUrl });
      }, 'image/png', 1.0);
    });
    
  } finally {
    // Clean up
    document.body.removeChild(screenshotContainer);
  }
};

// Helper functions for styling
function getRowBackgroundStyle(index) {
  if (index === 0) return 'background: linear-gradient(to right, rgba(234, 179, 8, 0.2), rgba(251, 146, 60, 0.2));';
  if (index === 1) return 'background: linear-gradient(to right, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.2));';
  if (index === 2) return 'background: linear-gradient(to right, rgba(217, 119, 6, 0.2), rgba(180, 83, 9, 0.2));';
  if (index < 8) return 'background: rgba(34, 197, 94, 0.1);';
  return 'background: rgba(59, 130, 246, 0.05);';
}

function getQEIColorStyle(qb, allQBsWithBaseScores = null) {
  const qei = qb.qei || 0;
  
  // Use fixed z-score thresholds (6-tier system)
  if (qei >= 91.1) return 'background: linear-gradient(to right, rgba(251, 191, 36, 0.3), rgba(251, 146, 60, 0.3)); color: #fef3c7;'; // Elite
  if (qei >= 77.3) return 'background: linear-gradient(to right, rgba(209, 213, 219, 0.3), rgba(156, 163, 175, 0.3)); color: #e5e7eb;'; // Excellent
  if (qei >= 59.9) return 'background: linear-gradient(to right, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3)); color: #bbf7d0;'; // Good
  if (qei >= 40.1) return 'background: linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3)); color: #dbeafe;'; // Average
  if (qei >= 22.7) return 'background: rgba(255, 255, 255, 0.15); color: #d1d5db;'; // Below Average
  return 'background: rgba(255, 255, 255, 0.1); color: #9ca3af;'; // Poor
}

function getQEILabel(qb, allQBsWithBaseScores = null) {
  // Use the dynamic tier function from uiHelpers
  const qei = qb.qei || 0;
  
  // Use fixed z-score percentile thresholds (6-tier system, Average centered at median)
  if (qei >= 91.1) return 'Elite';
  if (qei >= 77.3) return 'Excellent';
  if (qei >= 59.9) return 'Good';
  if (qei >= 40.1) return 'Average';
  if (qei >= 22.7) return 'Below Avg';
  return 'Poor';
}

async function getTeamLogosHtml(qb) {
  const teams = getQBTeams(qb);
  const logoPromises = teams.map(async (team) => {
    const teamInfo = getTeamInfo(team.team);
    if (teamInfo.logo) {
      try {
        // Create a promise to load the image and convert to base64
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Use high resolution for crisp rendering
            canvas.width = 64; // Good resolution for display
            canvas.height = 64;
            
            // Enable smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw at high resolution
            ctx.drawImage(img, 0, 0, 64, 64);
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            // Larger logos for better visibility
            resolve(`<img src="${dataUrl}" style="width: 32px; height: 32px; object-fit: contain; vertical-align: middle; border-radius: 4px;" alt="${team.team}" />`);
          };
          img.onerror = () => {
            // Fallback to team abbreviation if logo fails to load
            resolve(`<span style="color: white; font-weight: bold; font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">${team.team}</span>`);
          };
          img.src = teamInfo.logo;
        });
      } catch (error) {
        // Fallback to team abbreviation
        return `<span style="color: white; font-weight: bold; font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">${team.team}</span>`;
      }
    } else {
      // No logo available, use team abbreviation
      return `<span style="color: white; font-weight: bold; font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; display: inline-block;">${team.team}</span>`;
    }
  });
  
  const logos = await Promise.all(logoPromises);
  return logos.join(' ');
}

function getQBTeams(qb) {
  if (!qb.seasonData || qb.seasonData.length === 0) {
    return [{ team: qb.team }];
  }
  
  const uniqueTeams = [];
  const seenTeams = new Set();
  
  qb.seasonData.forEach(season => {
    if (season.teamsPlayed && season.teamsPlayed.length > 0) {
      season.teamsPlayed.forEach(team => {
        if (!seenTeams.has(team)) {
          seenTeams.add(team);
          uniqueTeams.push({ team: team });
        }
      });
    } else if (season.team && !seenTeams.has(season.team) && !season.team.match(/^\d+TM$/)) {
      seenTeams.add(season.team);
      uniqueTeams.push({ team: season.team });
    }
  });
  
  return uniqueTeams.length > 0 ? uniqueTeams : [{ team: qb.team }];
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 