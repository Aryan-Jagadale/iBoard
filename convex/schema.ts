import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    title: v.string(),
    orgId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    imageUrl: v.string(),
  }).index("by_org", ["orgId"]).searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId"],
    }),
  userFavorites: defineTable({
    orgId: v.string(),
    userId: v.string(),
    boardId: v.id("boards"),
  })
    .index("by_board", ["boardId"])
    .index("by_user_org", ["userId", "orgId"])
    .index("by_user_board", ["userId", "boardId"])
    .index("by_user_board_org", ["userId", "boardId", "orgId"]),

    // users: defineTable({
    //   id: v.string(),
    //   name: v.string(),
    //   email: v.string(),
    //   image: v.optional(v.string()),
    //   generations: v.optional(v.number()),
    // })
    // .index("unique_id", ["id"])
    // .index("unique_email", ["email"]),
  
    virtualboxes: defineTable({
      virtualboxId: v.string(),
      name: v.string(),
      type: v.union(
        v.literal("react"),
        v.literal("node"),
        v.literal("html-css"),
        v.literal("python"),
        v.literal("html-css-js"),
      ),
      visibility: v.optional(v.union(
        v.literal("public"),
        v.literal("private")
      )),
      authorId: v.string(),
    })
    .index("unique_id", ["virtualboxId"])
    .index("user_virtualboxes", ["authorId"]),
  
    usersToVirtualboxes: defineTable({
      authorId: v.string(),
      virtualboxId: v.string(),
      sharedOn: v.optional(v.number()),
    })
    .index("user_links", ["authorId"])
    .index("virtualbox_links", ["virtualboxId"])
    .index("user_virtualbox_link", ["authorId", "virtualboxId"])

});
