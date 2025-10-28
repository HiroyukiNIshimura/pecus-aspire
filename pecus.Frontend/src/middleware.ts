import { withAuth } from "next-auth/middleware";
export default withAuth({
  secret: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
});
export const config = {
  matcher: ["/((?!api|signin|_next).*)"],
};
