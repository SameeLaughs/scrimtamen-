const express = require('express');
// oopsies
const fs = require('fs');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');

const PORT = 3000;

app.use(express.json());

 
app.use(express.static(path.join(__dirname)));

 app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

 app.get('/reported-questions', (req, res) => {
    fs.readFile('reported_questions.json', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading report file');
        }

        let reports = [];
        if (data) {
            try {
                reports = JSON.parse(data);  
            } catch (e) {
                console.error('Error parsing JSON data:', e);
                return res.status(500).send('Error parsing report file');
            }
        }

        res.render('reportedQuestions', { reports }); // render ejs page
    });
});

// handle report
app.post('/report', (req, res) => {
    const { question, reason } = req.body;

    if (!question || !reason) {
        return res.status(400).send('Missing question or reason');
    }

    const reportedQuestion = {
        question,
        reason,
        timestamp: new Date().toLocaleString(),
    };

    // Read current reports
    fs.readFile('reported_questions.json', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading report file');
        }

        let reports = [];
        if (data) {
            try {
                reports = JSON.parse(data);
            } catch (e) {
                console.error('Error parsing JSON data:', e);
                return res.status(500).send('Error parsing report file');
            }
        }

        reports.push(reportedQuestion);

        // Save the updated reports
        fs.writeFile('reported_questions.json', JSON.stringify(reports, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send('Error saving report');
            }

            // Now update the questions.json file to move the reported question to the "faulty" category
            fs.readFile('questions.json', 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading questions file:', err);
                    return res.status(500).send('Error reading questions file');
                }

                let questions = [];
                if (data) {
                    try {
                        questions = JSON.parse(data);
                    } catch (e) {
                        console.error('Error parsing questions JSON:', e);
                        return res.status(500).send('Error parsing questions file');
                    }
                }

                // Find the reported question and update its category to "faulty"
                const updatedQuestions = questions.map(q => {
                    if (q.question === question) {
                        q.category = "faulty"; // Move to "faulty" category
                    }
                    return q;
                });

                // Save the updated questions
                fs.writeFile('questions.json', JSON.stringify(updatedQuestions, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing to questions file:', err);
                        return res.status(500).send('Error updating questions file');
                    }

                    console.log('Report saved and question moved to faulty category');
                    res.status(200).send('Question reported and moved to faulty category');
                });
            });
        });
    });
});

// Add this endpoint to your Express server
app.post("/update-category", (req, res) => {
    const { question, newCategory } = req.body;

    if (!question || !newCategory) {
        return res.status(400).send("Missing question or new category.");
    }

    // Read the questions.json file
    fs.readFile("questions.json", "utf8", (err, data) => {
        if (err) {
            console.error("Error reading questions file:", err);
            return res.status(500).send("Error reading questions file.");
        }

        let questions = [];
        if (data) {
            try {
                questions = JSON.parse(data);
            } catch (e) {
                console.error("Error parsing questions JSON:", e);
                return res.status(500).send("Error parsing questions file.");
            }
        }

        // Find the question and update its category
        const updatedQuestions = questions.map((q) => {
            if (q.question === question) {
                q.category = newCategory; // Update the category
            }
            return q;
        });

        // Save the updated questions
        fs.writeFile("questions.json", JSON.stringify(updatedQuestions, null, 2), (err) => {
            if (err) {
                console.error("Error writing to questions file:", err);
                return res.status(500).send("Error updating questions file.");
            }

            console.log("Question category updated successfully.");
            res.status(200).send("Question category updated successfully.");
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
