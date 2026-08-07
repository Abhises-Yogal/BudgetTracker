// MODEL layer: User schema, password hashing, and credential verification.
// No HTTP knowledge lives here. Controllers call only the named exports.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // Never send the hashed password back to the client
      select: false,
    },
    // Lets you invalidate all JWTs issued before a password change
    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // extra safety: never leak the hash
        delete ret.passwordChangedAt; // extra safety: never leak the timestamp
        return ret;
      },
    },
  }
);

const SALT_ROUNDS = 12;

userSchema.pre("save", function () {
  if (!this.isModified("password")) return;

  // Use synchronous bcrypt so the hash is applied before the document is persisted.
  this.password = bcrypt.hashSync(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

const User = mongoose.model("User", userSchema);

// Model methods

// createUser({ name, email, password })
// Inserts a new user. The pre-save hook hashes the password automatically.
// Throws a Mongoose ValidationError if email is already taken (unique index).
export async function createUser({ name, email, password }) {
  const user = await User.create({ name, email, password });
  return user.toJSON(); // password is stripped by the toJSON transform
}

// findByEmail(email)
// Returns the user including the hashed password field (needed for login). Returns null if not found.
export async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase().trim() }).select("+password");
}

// verifyPassword(plain, hashed)
// Compares a plain-text password against the stored bcrypt hash.
// Defensive: if the stored value isn't a valid bcrypt hash (e.g. legacy
// plaintext or a corrupted record), return false instead of throwing so a
// login attempt fails cleanly with 401 rather than a 500.
export async function verifyPassword(plain, hashed) {
  if (!plain || !hashed || typeof hashed !== "string") return false;
  try {
    return bcrypt.compareSync(plain, hashed);
  } catch {
    return false;
  }
}

export default User;