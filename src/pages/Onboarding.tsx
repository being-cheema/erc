import { useNavigate } from "react-router-dom";
import OnboardingCarousel from "@/components/onboarding/OnboardingCarousel";
import { markOnboardingComplete } from "@/components/AuthRouter";

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Mark onboarding as complete
    markOnboardingComplete();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <OnboardingCarousel onComplete={handleComplete} />
    </div>
  );
};

export default Onboarding;
