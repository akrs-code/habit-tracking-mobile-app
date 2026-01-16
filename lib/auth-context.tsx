import { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextTypes = {
    user: Models.User<Models.Preferences> | null;
    isLoadingUser: boolean;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextTypes | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        try {
            const user = await account.get();
            setUser(user);
        } catch {
            setUser(null);
        } finally {
            setIsLoadingUser(false);
        }
    };


    const signUp = async (email: string, password: string) => {
        try {
            await account.create(ID.unique(), email, password);
            await signIn(email, password);
            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occured during signup";
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession(email, password);
            await getUser();
            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occured during signIn";
        }
    };

    const signOut = async () => {
        try {
            await account.deleteSession("current");
            setUser(null);
            return null;
        } catch (error) {
            console.log(error);
            return "An error occured during signOut";
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, isLoadingUser, signIn, signUp, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
