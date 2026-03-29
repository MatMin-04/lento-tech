const https = require('https');

const API_KEY = 'a0f1d0c3fad447a2a616b8d72ff124fa';
const API_URL = 'https://api.football-data.org/v4/competitions/2019/matches';

const today = new Date();
const dateFrom = new Date(today);
const dateTo = new Date(today);
dateTo.setDate(today.getDate() + 30);

const fromStr = dateFrom.toISOString().split('T')[0];
const toStr = dateTo.toISOString().split('T')[0];

const url = `${API_URL}?status=SCHEDULED,TIMED&dateFrom=${fromStr}&dateTo=${toStr}`;
console.log('Fetching:', url);

const options = {
  headers: {
    'X-Auth-Token': API_KEY
  }
};

https.get(url, options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (!parsed.matches || parsed.matches.length === 0) {
        console.log('No matches found in API response.');
        return;
      }
      
      const futureMatches = parsed.matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED');
      console.log('Total future matches:', futureMatches.length);
      
      if (futureMatches.length === 0) {
        console.log('No future matches matched status filter.');
        return;
      }
      
      const nextMatchday = futureMatches[0].matchday;
      console.log('Next matchday found:', nextMatchday);
      
      const nextMatchdayMatches = futureMatches.filter(m => m.matchday === nextMatchday);
      console.log('Matches for next matchday:', nextMatchdayMatches.length);
      
      console.log('SUCCESS');
    } catch (e) {
      console.error('Parse error:', e, body.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.error(e);
});
