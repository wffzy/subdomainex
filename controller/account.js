exports.user = (req, res, next) => {
    if(req.user == null){
res.redirect('/auth');
} else {

let user = req.user
res.render('account', {user: user});
next()
}
};
