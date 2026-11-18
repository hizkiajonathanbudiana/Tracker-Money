"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef, // Impor useRef
} from "react";
import { User, onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Impor 'auth'
import { setCookie, destroyCookie } from "nookies";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Ref untuk menyimpan interval timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      // Hentikan timer lama setiap kali auth berubah
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (user) {
        setUser(user);
        const token = await user.getIdToken();
        setCookie(null, "firebaseAuthToken", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // LOGIKA BARU: JIKA PENGGUNA LOGIN TAPI BELUM VERIFIKASI
        if (!user.emailVerified) {
          // Mulai timer untuk mengecek ulang status user setiap 3 detik
          intervalRef.current = setInterval(async () => {
            try {
              // Cek pengguna saat ini dan paksa reload datanya dari server
              if (auth.currentUser) {
                await auth.currentUser.reload();
                // Jika setelah reload, statusnya terverifikasi
                if (auth.currentUser.emailVerified) {
                  // Hentikan timer
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  // Update user state hanya jika komponen masih mounted
                  setUser(auth.currentUser);
                  // Redirect ke app dengan delay kecil untuk memastikan state terupdate
                  setTimeout(() => {
                    router.push("/app");
                  }, 100);
                }
              }
            } catch (error) {
              console.error("Error reloading user:", error);
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          }, 3000); // Cek setiap 3 detik
        }
      } else {
        setUser(null);
        destroyCookie(null, "firebaseAuthToken", { path: "/" });
      }
      setLoading(false);
    });

    // Cleanup function: hentikan langganan DAN timer saat komponen di-unmount
    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);