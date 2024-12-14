import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getVitualBoxSharedWith = query({
  args: { authorId: v.string(), vbIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    let sharedWith = await ctx.db
      .query("usersToVirtualboxes")
      .withIndex("user_links", (q) => q.eq("authorId", args.authorId))
      .collect();


    return sharedWith ?? [];


  }
})


export const getVirtualBoxes = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    let virtualBoxes = await ctx.db
      .query("virtualboxes")
      .withIndex("user_virtualboxes", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .collect();
      return virtualBoxes;

  },
})
