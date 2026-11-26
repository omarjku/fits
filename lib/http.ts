export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Run a route body and turn the result or the error into a JSON response. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn())
  } catch (e) {
    if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status })
    console.error(e)
    return Response.json({ error: 'Something went wrong on the server.' }, { status: 500 })
  }
}
