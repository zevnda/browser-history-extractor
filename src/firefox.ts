import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { URL } from 'url';

// Define paths for the SQLite database and output JSON file
const dbPath = 'put-browser-history-files-here/places.sqlite';
const outputPath = 'out/firefox_output.json';

// Define interface for browser history data structure
interface BrowserHistory {
  url: string;                        // The complete URL of the page
  title: string | null;               // Page title
  last_visit_date: string | null;     // Last time the page was visited
  total_visits: number;               // Total number of visits to this URL
  frecency: number;                   // Firefox's frequency/recency ranking
}

try {
  // Create output directory if it doesn't exist
  if (!existsSync('out')) {
    mkdirSync('out');
  }

  // Initialize SQLite database connection
  const db = new Database(dbPath);
  
  // Query browser history from Firefox's places.sqlite database
  const rows = db.prepare(`
    SELECT 
      p.url,
      p.title,
      datetime(p.last_visit_date/1000000, 'unixepoch') AS last_visit_date,
      p.frecency,
      p.visit_count as total_visits
    FROM moz_places p
    WHERE p.visit_count > 10
    ORDER BY p.visit_count DESC
  `).all() as BrowserHistory[];

  // Map to store unique URLs and their aggregated data
  const urlGroups = new Map<string, BrowserHistory>();
  
  // Process each row from the database
  rows.forEach(row => {
    try {
      // Parse the URL to extract base domain information
      const urlObj = new URL(row.url);
      const basePath = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // Remove trailing slashes for consistent URL matching
      const normalizedUrl = row.url.replace(/\/$/, '');
      
      // Check if this URL already exists in our map
      const existingEntry = urlGroups.get(normalizedUrl);
      
      if (existingEntry) {
        // If URL exists, aggregate visit counts and bookmark status
        existingEntry.total_visits += row.total_visits;
      } else {
        // If URL is new, add it to the map
        urlGroups.set(normalizedUrl, { 
          ...row,
          url: normalizedUrl
        });
      }
      
      // Track domain-level statistics
      if (!urlGroups.has(basePath)) {
        // Initialize domain entry if it doesn't exist
        urlGroups.set(basePath, {
          ...row,
          url: basePath,
          total_visits: 0
        });
      }
      
      // Aggregate visits at the domain level
      const basePathEntry = urlGroups.get(basePath)!;
      basePathEntry.total_visits += row.total_visits;
    } catch (e) {
      console.warn(`Invalid URL: ${row.url}`);
    }
  });

  // Convert map to array, sort by total_visits, and save to JSON file
  const results = Array.from(urlGroups.values())
    .sort((a, b) => b.total_visits - a.total_visits);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Data saved to ${outputPath}`);
  
  // Close database connection
  db.close();
} catch (err) {
  console.error('Error:', err);
}