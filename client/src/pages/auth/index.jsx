import Background from "@/assets/login2.png";
import Victory from "../../assets/victory.svg";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import apiClient from "@/lib/api-client.js";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "../../utils/constants.js";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/index.js";



const Auth = () => {
  const navigate = useNavigate();
  const {setUserInfo}= useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [signupTouched, setSignupTouched] = useState({ email: false, password: false, confirmPassword: false });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    if (!email.length) {
      setLoginError("Email is required!");
      return false;
    }
    if (!emailRegex.test(email)) {
      setLoginError("Please enter a valid email address!");
      return false;
    }
    if (!password.length) {
      setLoginError("Password is required!");
      return false;
    }
    setLoginError("");
    return true;
  }

  const validateSignup = () => {
    if (!email.length) {
      setSignupError("Email is required!");
      return false;
    }
    if (!emailRegex.test(email)) {
      setSignupError("Please enter a valid email address!");
      return false;
    }
    if (!password.length) {
      setSignupError("Password is required!");
      return false;
    }
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters!");
      return false;
    }
    if (password !== confirmPassword) {
      setSignupError("Password and Confirm Password are not the same!");
      return false;
    }
    setSignupError("");
    return true;
  };

  const handleLogin = async () => {
    setLoginTouched({ email: true, password: true });
    if(validateLogin()) {
      setLoginLoading(true);
      try {
        const response = await apiClient.post(LOGIN_ROUTE,{email,password},{withCredentials:true})
        if(response.data.user.id){
          setUserInfo(response.data.user);
          toast.success("Login successful!");
          if(response.data.user.profileSetup) {navigate("/chat");}
          else {navigate("/profile");}
        }
      } catch (err) {
        setLoginError("Invalid email or password!");
      } finally {
        setLoginLoading(false);
      }
    }
  };
  const handleSignup = async () => {
    setSignupTouched({ email: true, password: true, confirmPassword: true });
    if (validateSignup()) {
      setSignupLoading(true);
      try {
        const response = await apiClient.post(SIGNUP_ROUTE, { email, password },{ withCredentials: true });
        if(response.status === 201){
          setUserInfo(response.data.user);
          toast.success("Signup successful! Please complete your profile.");
          navigate("/profile");
        }
      } catch (err) {
        setSignupError("Signup failed! Try a different email.");
      } finally {
        setSignupLoading(false);
      }
    }
  };  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 flex items-center justify-center p-4">
      <div className="h-[80vh] bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl grid xl:grid-cols-2 overflow-hidden">
        <div className="flex flex-col gap-10 items-center justify-center p-8">
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center justify-center">
              <h1 className="text-4xl font-bold md:text-5xl ml-5 bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
                Hoşgeldiniz
              </h1>
              <img
                src={Victory}
                alt="Victory emoji"
                className="h-[100px]"
              />
            </div>
            <p className="font-medium text-center text-fuchsia-200">Burada olmak harika</p>
          </div>
          <div className="flex items-center justify-center w-full">
            <Tabs className="w-3/4" defaultValue="login">
              <TabsList className="bg-white/5 backdrop-blur-sm w-full">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-transparent text-fuchsia-200 text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-fuchsia-300 data-[state=active]:font-semibold data-[state=active]:border-b-fuchsia-500 p-3 transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-fuchsia-200 text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-fuchsia-300 data-[state=active]:font-semibold data-[state=active]:border-b-fuchsia-500 p-3 transition-all duration-300"
                >
                  SignUp
                </TabsTrigger>
              </TabsList>
              <TabsContent className="flex flex-col gap-5 mt-5" value="login">
                <Input
                  placeholder="Email"
                  type="email"
                  className={`rounded-full p-6 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40 ${loginTouched.email && loginError ? 'border-red-500' : ''}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(""); setLoginTouched(t => ({...t, email: true})); }}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className={`rounded-full p-6 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40 ${loginTouched.password && loginError ? 'border-red-500' : ''}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); setLoginTouched(t => ({...t, password: true})); }}
                />
                {loginError && <div className="text-red-400 text-sm text-center -mt-3">{loginError}</div>}
                <Button
                  className="rounded-full p-6 cursor-pointer bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
                  onClick={handleLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Loading...' : 'Login'}
                </Button>
              </TabsContent>
              <TabsContent className="flex flex-col gap-5 mt-5" value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className={`rounded-full p-6 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40 ${signupTouched.email && signupError ? 'border-red-500' : ''}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSignupError(""); setSignupTouched(t => ({...t, email: true})); }}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className={`rounded-full p-6 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40 ${signupTouched.password && signupError ? 'border-red-500' : ''}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setSignupError(""); setSignupTouched(t => ({...t, password: true})); }}
                />
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  className={`rounded-full p-6 bg-white/5 border-fuchsia-500/20 text-fuchsia-100 placeholder-fuchsia-300/40 focus:border-fuchsia-500/40 ${signupTouched.confirmPassword && signupError ? 'border-red-500' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setSignupError(""); setSignupTouched(t => ({...t, confirmPassword: true})); }}
                />
                {signupError && <div className="text-red-400 text-sm text-center -mt-3">{signupError}</div>}
                <Button
                  className="rounded-full p-6 cursor-pointer bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
                  onClick={handleSignup}
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Loading...' : 'SignUp'}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 backdrop-blur-sm">
          <img src={Background} alt="background" className="h-[auto] opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
