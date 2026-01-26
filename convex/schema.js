import { defineSchema,defineTable} from "convex/server";
import { v } from "convex/values";


export default defineSchema({   
  users: defineTable({
  name: v.string(),
  email: v.string(),
  tokenIdentifier: v.string(), // Ckerk user ID for auth
  imageUrl:v.optional(v.string()), //Profile picture
  username:v.optional(v.string()), // Unque username for public profiles

  // Activity timestamps
  createdAt: v.number(),
  lastActiveAt: v.number(),
  
}).index("by_token", ["tokenIdentifier"]),
})