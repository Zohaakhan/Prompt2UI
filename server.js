
import OpenAI from 'openai';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express(); 
const port = 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



app.use(bodyParser.json());

app.use(express.static('public'));

app.post('/generate-website', async(req, res) => {
    const prompt = req.body.prompt;

    try{
        const gptresponse = await generateHtmlCss(prompt);
        res.send(gptresponse);

    }
    catch(error){
        console.error('Error generating HTML/CSS:', error);
        res.status(500).send('Error generating');
    }
});

async function generateHtmlCss(prompt) {
    const maxRetries = 5;
    let retries = 0;
    let backoff = 1000; 

    while (retries < maxRetries) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that creates websites based on user input.' },
                    { role: 'user', content: `Create a website based on the following prompt: ${prompt}` },
                ],
                max_tokens: 1500,
            });

            if (response.choices && response.choices.length > 0) {
                // Extract only the HTML part from the response
                const htmlContent = response.choices[0].message.content.match(/<html[\s\S]*<\/html>/);
                return htmlContent ? htmlContent[0] : '';
            } else {
                throw new Error('No valid response from OpenAI API');
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log(`Rate limit exceeded. Retrying in ${backoff / 1000} seconds...`);
                retries++;
               
                await sleep(backoff);
                backoff *= 2; 
            } else {
                throw error; 
            }
        }
    }

    throw new Error('Max retries exceeded');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


app.listen(port, () => { console.log(`Server is running on http://localhost:${port}`); });