import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig } from "motion/react";
import { useState } from "react";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { SignUpAccountStep } from "./sign-up-account-step";
import { SignUpConnectStep } from "./sign-up-connect-step";
import { SignUpStepper } from "./sign-up-stepper";
import { SignUpSyncStep } from "./sign-up-sync-step";

function SignUp() {
  const navigate = useNavigate();
  const { isPending } = authClient.useSession();
  const [step, setStep] = useState(0);

  if (isPending) {
    return <Loader />;
  }

  const goToDashboard = () => {
    navigate({
      to: "/dashboard",
    });
  };

  return (
    <MotionConfig
      transition={{
        type: "tween",
        duration: 0.22,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-md">
        <SignUpStepper currentStep={step} />

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <SignUpAccountStep onComplete={() => setStep(1)} />
            ) : null}

            {step === 1 ? (
              <SignUpConnectStep
                onConnected={() => setStep(2)}
                onSkip={goToDashboard}
              />
            ) : null}

            {step === 2 ? <SignUpSyncStep onComplete={goToDashboard} /> : null}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

export { SignUp };
