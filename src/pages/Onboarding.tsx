import { useNavigate } from "react-router-dom";
import OnboardingCarousel from "@/components/onboarding/OnboardingCarousel";

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem("onboarding_complete", "true");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <OnboardingCarousel onComplete={handleComplete} />
    </div>
  );
};

export default Onboarding;
