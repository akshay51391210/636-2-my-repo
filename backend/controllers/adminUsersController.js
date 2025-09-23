const User = require('../models/User');

exports.listUsers = async (req, res) => {
  const users = await User.find({}, 'email role password createdAt').lean();
  // hash password
  const data = users.map(u => ({
    _id: u._id,
    email: u.email,
    role: u.role,
    passwordPreview: u.password ? (u.password.slice(0, 12) + '…') : '',
    createdAt: u.createdAt,
  }));
  res.json(data);
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'owner', 'vet'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true, context: 'query' }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ _id: user._id, email: user.email, role: user.role });
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  //Prevent admin delete himselef
  if (String(req.user._id) === id) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  const r = await User.findByIdAndDelete(id);
  if (!r) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
};
