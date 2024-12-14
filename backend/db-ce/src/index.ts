/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { json } from 'itty-router-extras';



export default {
	async fetch(request, env, ctx): Promise<Response> {

		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;



		console.log(path);

		if (path === '/api/user' && method === 'GET') {
			const params = url.searchParams;

			if (params.has('id')) {

				// const id = params.get('id') as string;

				// const res = await db.query.user.findFirst({
				// 	where: (user, { eq }) => eq(user.id, id)
				// });
				// return json(res ?? {});
			} else {
				// const res = await db.select().from(user).all();
				// return new Response(JSON.stringify(res));
			}

		}




	},
} satisfies ExportedHandler<Env>;
