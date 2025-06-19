import jwt from "jsonwebtoken";
import { getUserById } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_this_in_production";

// Default auth middleware
export default async function auth(req, res, next) {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No authentication token, authorization denied" });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database
      const user = await getUserById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Add user to request object
      req.user = user;
      return next();
      
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ message: "Token is not valid" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Authentication middleware for use in API routes
export async function authenticateUser(req, res) {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return { success: false, error: "No authentication token, authorization denied" };
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database
      const user = await getUserById(decoded.id);
      
      if (!user) {
        return { success: false, error: "User not found" };
      }
      
      // Return user
      return { success: true, user };
      
    } catch (error) {
      console.error("Token verification failed:", error);
      return { success: false, error: "Token is not valid" };
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return { success: false, error: "Server error" };
  }
}

// Higher-order function to wrap API handlers with authentication
export function withAuth(handler) {
  return async (req, res) => {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No authentication token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Get user from database
      const user = await getUserById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Add user to request object
      req.user = user;
      
      // Call the original handler with the authenticated request
      return handler(req, res);
      
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  };
}

// Check if user has HR role
export function isHR(user) {
  return user && (user.role === "hr" || user.role === "admin");
}
