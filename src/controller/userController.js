import passport from "passport";
import routes from "../routes";
import User from "../Models/User";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });

export const postJoin = async (req, res, next) => {
  const {
    body: { name, email, password, verifyPassword }
  } = req;
  if (password !== verifyPassword) {
    req.flash("error", "Check your password");
    res.status(400);
    res.render("join", { pageTitle: "Join" });
  } else {
    try {
      const user = await User({
        name,
        email
      });
      await User.register(user, password);
      next();
    } catch (error) {
      req.flash("error", "Can't register user now");
      res.redirect(routes.home);
    }
  }
};

export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Log In" });

export const postLogin = passport.authenticate("local", {
  successRedirect: routes.home,
  failureRedirect: routes.login,
  successFlash: "Welcome!",
  failureFlash: "Check you email or password"
});

// git auth
export const githubLoginAskOwner = passport.authenticate("github", {
  failureFlash: "We need your permission to login with you Github Account"
});

export const githubLoginFindOrCreate = passport.authenticate("github", {
  failureRedirect: routes.login,
  successFlash: "Welcome!",
  failureFlash: "Can't log in"
});

export const githubLoginSuccess = (req, res) => {
  res.redirect(routes.home);
};

export const githubLoginCallback = async (_, __, profile, cb) => {
  const {
    _json: { id, avatar_url: avatarUrl, name, email }
  } = profile;
  try {
    const user = await User.findOne({ email });
    if (user) {
      user.githubId = id;
      user.save();
      return cb(null, user);
    }
    const newUser = await User.create({
      name,
      email,
      avatarUrl,
      githubId: id
    });
    return cb(null, newUser);
  } catch (error) {
    return cb(error);
  }
};

// facebook auth
export const facebookLoginAskOwner = passport.authenticate("facebook", {
  scope: ["email", "public_profile"],
  failureFlash: "We need your permission to login with you Facebook Account"
});

export const facebookLoginFindOrCreate = passport.authenticate("facebook", {
  failureRedirect: routes.login,
  successFlash: "Welcome!",
  failureFlash: "Can't log in"
});

export const facebookLoginSuccess = (req, res) => {
  res.redirect(routes.home);
};

export const facebookLoginCallback = async (_, __, profile, cb) => {
  const {
    _json: { id, name, email }
  } = profile;
  try {
    const user = await User.findOne({ email });
    if (user) {
      user.facebookId = id;
      user.avatarUrl = `https://graph.facebook.com/${id}/picture?type=large`;
      user.save();
      return cb(null, user);
    }
    const newUser = await User.create({
      name,
      email,
      avatarUrl: `https://graph.facebook.com/${id}/picture?type=large`,
      facebookId: id
    });
    return cb(null, newUser);
  } catch (error) {
    return cb(error);
  }
};

export const logout = (req, res) => {
  req.flash("success", "Logged Out");
  req.logout();
  res.redirect(routes.home);
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("videos");
    res.render("userDetail", { pageTitle: "User Detail", user });
  } catch (error) {
    res.redirect(routes.home);
  }
};

export const userDetail = async (req, res) => {
  const {
    params: { id }
  } = req;
  try {
    const user = await User.findById(id).populate("videos");
    res.render("userDetail", { pageTitle: "User Detail", user });
  } catch (error) {
    req.flash("error", "User not found");
    res.redirect(routes.home);
  }
};

export const getEditProfile = (req, res) =>
  res.render("editProfile", { pageTitle: "Edit Profile" });

export const postEditProfile = async (req, res) => {
  const {
    body: { name, email },
    file
  } = req;
  try {
    await User.findByIdAndUpdate(req.user.id, {
      name,
      email,
      avatarUrl: file ? file.location : req.user.avatarUrl
    });
    req.flash("success", "Profile updated");
    res.redirect(routes.me);
  } catch (error) {
    req.flash("error", "Can't edit profile");
    res.redirect(`${routes.users}${routes.editProfile}`);
  }
};

export const getChangePassword = (req, res) =>
  res.render("changePassword", { pageTitle: "Change Password" });

export const postChangePassword = async (req, res) => {
  const {
    body: { oldPassword, newPassword, newPassword1 }
  } = req;
  try {
    if (newPassword !== newPassword1) {
      req.flash("error", "Check if password match");
      res.status(400);
      res.redirect(`${routes.users}${routes.changePassword}`);
    }
    await req.user.changePassword(oldPassword, newPassword);
    req.flash("success", "Password changed");
    res.redirect(routes.me);
  } catch (error) {
    req.flash("error", "Can't change password");
    res.status(400);
    res.redirect(`${routes.users}${routes.changePassword}`);
  }
};
