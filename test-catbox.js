const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
    fs.writeFileSync('test.txt', 'hello world 123');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream('test.txt'), {
        filename: 'test.txt',
        contentType: 'text/plain'
    });

    try {
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        console.log('Success:', response.data);
    } catch(err) {
        console.log('Error:', err.message);
        if (err.response) console.log(err.response.data);
    }
}
testUpload();
