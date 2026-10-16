declare global {
  namespace App {
    interface Locals { user: { uid: string; name: string; email: string } | null }
  }
}
export {};
