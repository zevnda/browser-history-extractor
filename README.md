# Browser History Extractor

A simple TypeScript tool for extracting and analyzing browser history data from Firefox and Chrome browsers.

## Installation

1. Clone the repo and install dependencies
   ```bash
   git clone https://github.com/zevnda/browser-history-extractor
   cd browser-history-extractor
   npm install
   ```
3. For Windows users:
   ```bash
   npm install -global node-gyp
   cd node_modules\.pnpm\better-sqlite3@11.10.0\node_modules\better-sqlite3
   node-gyp rebuild
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Firefox History

1. Locate your Firefox profile folder:
   - Windows: `C:\Users\<user>\AppData\Roaming\Mozilla\Firefox\Profiles\<uid>.default-release`
2. Copy `places.sqlite` to the `put-browser-history-files-here` folder
3. Run:
   ```bash
   npm run start:firefox
   ```

### Chrome History

1. Locate your Chrome profile folder:
   - Windows: `C:\Users\<user>\AppData\Local\Google\Chrome\User Data\Default`
2. Copy `History` file to the `put-browser-history-files-here` folder
3. Run:
   ```bash
   npm run start:chrome
   ```

## Output

The extracted data will be saved in the `out` folder:
- Firefox: `out/firefox_output.json`
- Chrome: `out/chrome_output.json`

## License

GPL-3.0
