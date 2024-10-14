const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();
// 读取公钥
const publicKey = fs.readFileSync(process.env.PUBLIC_KEY_FILE);

// 你的JWT Token
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2aWV3ZXIiLCJpYXQiOjE3Mjg4MTE0ODYsImV4cCI6MTc0NDM2MzQ4Niwicm9sZSI6InZpZXdlciJ9.FUMPkglXF-0XIgUVUCp40RBX--vosOiDCOyvwoPOJIVFgIUktXdphwPUS1Yxlan3oXm46ZTpZ5U-EqvGyLplNNKgnJ1jZbr6Zt0qszhB-Lez-F31YOmOLfAnq-slhmFV049IyBRbSRX21TGNMSS4wEaLibP8-78ltYg6ZpgNZMa8nrAn7z4dYhviGai_69XUfJ0UJ8Ewrs8IKfGzZJ-YZQ7KPBRGjvT_yyKmO_w8nsjRWfGbkfD97ImWIibk55sPV-goJQG9NPiMuc_1BE7K98Q-aE4tJ6Jw5lVtTPUePxokg3rtXtT8xWrQcDs7SULzlwKb2d8rNW_dAy0EKzP5RQ';

// 验证JWT Token
jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
  if (err) {
    console.log("Invalid Token:", err);
  } else {
    console.log("Valid Token. Decoded payload:", decoded);
  }
});