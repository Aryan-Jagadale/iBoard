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
      type: v.union(v.literal("react"), v.literal("node"), v.literal("html-css"), v.literal("python"),v.literal("html-css-js"), v.literal("react-tailwind")),
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

//Previews
export const storePreview = mutation({
  args: {
    vbId: v.optional(v.string()),
    indexHtml: v.optional(v.string()),
    bundle: v.optional(v.string()),
    cssFiles: v.optional(v.string()),
    virtualboxType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { db } = ctx;
    const existing = await db
      .query("previews")
      .withIndex("by_vbId", (q) => q.eq("vbId", args.vbId ?? ""))
      .first();
    
    if (existing) {
      await db.patch(existing._id, {
        indexHtml: args.indexHtml,
        bundle: args.bundle ?? "",
        cssFiles: args.cssFiles,
        virtualboxType:args.virtualboxType,
        timestamp: Date.now(),
      });
    } else {
      await db.insert("previews", {
        vbId: args.vbId ?? "",
        indexHtml: args.indexHtml ?? "",
        bundle: args.bundle ?? "",
        virtualboxType:args.virtualboxType ?? "",
        cssFiles: args.cssFiles ?? "",
        timestamp: Date.now(),
      });
    }
  },
});


export const getPreview = query({
  args: { vbId: v.string() },
  handler: async (ctx, args) => {
    const { db } = ctx;
    return await db
      .query("previews")
      .withIndex("by_vbId", (q) => q.eq("vbId", args.vbId))
      .first();
  },
});