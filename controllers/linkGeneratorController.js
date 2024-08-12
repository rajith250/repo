

exports.directLogin = (req, res) => {
  const { logincode } = req.query;
  interval = process.env.DIRECT_LOGIN_EXPIRY;

  req.db.query('SELECT * FROM users WHERE login_code = ? AND login_code_generated >= NOW() - INTERVAL ? SECOND', [logincode, interval], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {  
      // Valid login code
      const user = results[0];  console.log(user);
      const token = generateRandomString(10); 

      

      // Clear login_code 
      req.db.query('UPDATE users SET login_code = NULL, token = ? WHERE id_user = ?', [token, user.id_user], (updateErr) => {
          if (updateErr) {
              console.error('Error clearing login_code:', updateErr);          
          }
          req.session.user = { ...user, token };
          res.render('home', { username: user.username, token_no: token, msgExtra : 'Logged in through link generator.' });
      });


    } else {
      // Invalid login code
      res.render('login', { title: 'Login', message: 'Invalid or expired login code' });
    }
  });

};



exports.generateLink = (req, res) => {    
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    req.db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            
            const user = results[0];            
            const loginCode = generateRandomString(10);

            
            req.db.query('UPDATE users SET login_code = ?, login_code_generated=NOW() WHERE id_user = ?', [loginCode, user.id_user], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating login_code:', updateErr);
                    return res.status(500).send('Internal Server Error');
                }

                const link = `${req.protocol}://` + process.env.APP_URL + `/directlogin?logincode=${loginCode}`;
                res.json({ link });
            });

        } else {
            // Invalid credentials
            res.status(401).send('Invalid username or password');
        }
    });
};




const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
};
