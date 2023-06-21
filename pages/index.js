import Head from "next/head";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { isLoading, error, user } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div> {error.message}</div>;

  return (
    <>
      <Head>
        <title>Chatty Pete - Login or Signup</title>
      </Head>

      <div className=" flex min-h-screen w-full items-center justify-center bg-gray-800 text-center text-white">
        <div>
          <div
            className="mb-2  text-6xl text-emerald-200
          "
          >
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <h1 className="text-4xl font-bold">Welcome to ChatOG</h1>
          <p className="text-large mb-2 mt-2">
            {" "}
            Log in with your account to talk to ChatOG
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {!user && (
              <>
                <Link
                  href="/api/auth/login"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  Login
                </Link>
                <Link
                  href="/api/auth/signup"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const session = await getSession(ctx.req, ctx.res);
  if (!!session) {
    return {
      redirect: {
        destination: "/chat",
      },
    };
  }

  return {
    props: {},
  };
};
