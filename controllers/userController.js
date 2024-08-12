
 
  

 
   
exports.test = async (req, res) => {

     res.status(404).json({ message: 'Testing'});


};



exports.login = async (req, res) => {

    console.log('Login fn in userController....');    
    const { username, password } = req.body;    


    const query = 'SELECT * FROM users WHERE username = ? and active=1';
    req.db.query(query, [username], (err, results) => {
        if (err) { console.error('Error executing query:', err);  return res.status(500).send('Internal Server Error'); }
        if (results.length > 0) {


            const query = 'SELECT * FROM users WHERE username = ? AND password = ?';    
            req.db.query(query, [username, password], (err, results) => {
                if (err) { console.error('Error executing query:', err);  return res.status(500).send('Internal Server Error'); }

                // LOGIN SUCCESS ----------------------------
                if (results.length > 0) {
                    console.log('Login success');            
                    req.session.user = results[0];
                    user = results[0];

                    const token = generateRandomString(10); 
                    req.db.query('UPDATE users SET token = ?, wrong_login_attempt=0 WHERE id_user = ?', [token, user.id_user], (err) => {
                        if (err) {
                            console.error('Error during updating token:', err);                    
                        }
                        // Set session and redirect to home page
                        req.session.user = { ...user, token };  
                        // res.render('home', { username: user.username, token_no: token });
                        res.redirect('home');
                    });



                } else {
                    console.log('Login Failed !. Password is wrong.');  //console.log(results);

                    blockIfToomanyAttemps(req, res, username);

                    const query = 'UPDATE users SET wrong_login_attempt=wrong_login_attempt+1 WHERE username = ?';
                    req.db.query(query, [username], (err, results) => {
                        res.render('login', { message: 'Password entered is wrong.' });                        
                    });                    
                    
                }
            });




        } else {
            res.render('login', { message: 'User does not exists or inactive user.!' });
        }

    }); // If username exists

 


 

} // login




exports.deleteUser = async (req, res) => {

    // console.log(req);
    const username  = req.body.usertodelete;    console.log(req.body.usertodelete);
    const query = 'UPDATE users SET active=0 WHERE username = ?';
    req.db.query(query, [username], (err, results) => {   console.log(query);
        if (err) { console.error('Error executing query:', err);  return res.status(500).send('Internal Server Error'); }
        res.render('home-admin', { title: 'Admin - Home', msg:'User is deleted.', user: req.session.user, token_no :req.session.user.token });
    });

}




const blockIfToomanyAttemps = (req, res, username) => {

    const query = 'SELECT * FROM users WHERE username = ?';
    req.db.query(query, [username], (err, results) => {

        let maxAttempt = process.env.MAX_ATTEMPT;
        if(results[0].wrong_login_attempt > maxAttempt) {
            const query = 'UPDATE users SET active=0 WHERE username = ?';
            req.db.query(query, [username], (err, results) => {
                    if (err) {
                        console.error('Error during disabling the user : ', err);                    
                    }
            });    
        }         

    });    
};






exports.getTime = (req, res) => {
  
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    // Split the header into parts
    const parts = authHeader.split('=');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      console.log('Token:', token);


      query = 'SELECT * FROM users WHERE token = ?';
      req.db.query(query, [token], (err, results) => {
         if (results.length > 0) {
              const now = new Date();              
              const currentTime = now.toISOString();
              res.json({ 'Current time': currentTime });

         } else {
            res.status(401).send('Token is wrong or expired');        
         }
      });


      
      // res.send('Token received');
    } else {
      res.status(401).send('Invalid Authorization header format');
    }
  } else {
    res.status(401).send('Authorization header not found');
  }
};





function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}
 

 

 
