import React from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        language: 'jp' // default language
      });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <button onClick={handleGoogleLogin} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
      Login with Google
    </button>
  );
};

export default Login;