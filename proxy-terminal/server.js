const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.static('public'));

app.get('/fetch', async (req, res) => {
    let url = req.query.url;
    if (!url) return res.status(400).json({ error: 'No URL provided' });
    if (!url.startsWith('http')) url = 'https://' + url;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
            const $ = cheerio.load(response.data);
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    const absolute = new URL(href, url).href;
                    $(el).attr('href', `/fetch?url=${encodeURIComponent(absolute)}`);
                }
            });
            $('img[src], script[src], link[rel="stylesheet"]').each((_, el) => {
                const src = $(el).attr('src') || $(el).attr('href');
                if (src) {
                    const absolute = new URL(src, url).href;
                    $(el).attr('src' in el.attribs ? 'src' : 'href', `/fetch?url=${encodeURIComponent(absolute)}`);
                }
            });
            res.set('Content-Type', 'text/html');
            res.send($.html());
        } else {
            res.set('Content-Type', contentType);
            res.send(response.data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message, code: err.code });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy terminal running on port ${PORT}`));
