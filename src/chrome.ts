import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { URL } from 'url';

// Define paths for the SQLite database and output JSON file
const dbPath = 'put-browser-history-files-here/History';
const outputPath = 'out/chrome_output.json';

// Define interface for browser history data structure
interface BrowserHistory {
  url: string;                        // The complete URL of the page
  title: string | null;               // Page title
  last_visit_date: string | null;     // Last time the page was visited
  total_visits: number;               // Total number of visits to this URL
}

try {
  if (!existsSync('out')) {
    mkdirSync('out');
  }

  const db = new Database(dbPath);
  
  // Query browser history from Chrome's History database
  const rows = db.prepare(`
    SELECT 
      url,
      title,
      datetime(last_visit_time/1000000 - 11644473600, 'unixepoch') AS last_visit_date,
      visit_count as total_visits
    FROM urls
    WHERE visit_count > 10
    ORDER BY visit_count DESC
  `).all() as BrowserHistory[];

  // Map to store unique URLs and their aggregated data
  const urlGroups = new Map<string, BrowserHistory>();
  
  // Process each row from the database
  rows.forEach(row => {
    try {
      const urlObj = new URL(row.url);
      const basePath = `${urlObj.protocol}//${urlObj.hostname}`;
      const normalizedUrl = row.url.replace(/\/$/, '');
      
      const existingEntry = urlGroups.get(normalizedUrl);
      
      if (existingEntry) {
        existingEntry.total_visits += row.total_visits;
      } else {
        urlGroups.set(normalizedUrl, { 
          ...row,
          url: normalizedUrl,
        });
      }
      
      if (!urlGroups.has(basePath)) {
        urlGroups.set(basePath, {
          ...row,
          url: basePath,
          total_visits: 0
        });
      }
      
      const basePathEntry = urlGroups.get(basePath)!;
      basePathEntry.total_visits += row.total_visits;
    } catch (e) {
      console.warn(`Invalid URL: ${row.url}`);
    }
  });

  const results = Array.from(urlGroups.values())
    .sort((a, b) => b.total_visits - a.total_visits);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Data saved to ${outputPath}`);
  
  db.close();
} catch (err) {
  console.error('Error:', err);
}
