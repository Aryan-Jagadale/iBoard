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
});

export const postVirtualBoxes = mutation({
  args: {
    data: v.object({
      type: v.union(v.literal("react"), v.literal("node"), v.literal("html-css"), v.literal("python"),v.literal("html-css-js")),
      userId: v.string(),
      name: v.string(),
      visibility: v.union(v.literal("public"), v.literal("private")),
      virtualboxId: v.string(),
    })
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }  

    const vbox = await ctx.db.insert("virtualboxes", {
      authorId: args.data.userId,
      name: args.data.name,
      visibility: args.data.visibility,
      type: args.data.type,
      virtualboxId: args.data.virtualboxId
    });

    return vbox;

  },
});

export const updateVirtualbox = mutation({
  args: {
    id: v.id('virtualboxes'),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { visibility: args.visibility });
  },

});

export const deleteVirtualbox = mutation({
  args: {
    id: v.id('virtualboxes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },

});
