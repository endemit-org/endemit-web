export default function AnimatedEndemitLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256.03 51.44"
      className="w-full max-w-md"
    >
      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        .draw-path {
          stroke: currentColor;
          stroke-width: 2.5;
          fill: transparent;
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2.1s ease-in-out forwards, strokeFadeOut 0.3s ease-in-out 0.6s forwards;
        }
        .fill-path {
          fill: currentColor;
          opacity: 0;
          animation: fadeIn 0.5s ease-in-out 0.5s forwards;
        }
      `}</style>
      <path
        className="draw-path"
        d="M0,15.12h32.81v21.81H9.24v6.4h23.57v8.1H0V15.12ZM9.24,28.83h14.33v-5.54h-14.33v5.54Z"
      />
      <path
        className="draw-path"
        d="M63.05,23.93h-12.89v27.45h-9.24V15.07h31.36v36.32h-9.24v-27.45Z"
      />
      <path
        className="draw-path"
        d="M111.65,51.44h-32.81V15.12h23.57V0h9.24v51.44ZM88.08,42.65h14.33v-18.66h-14.33v18.66Z"
      />
      <path
        className="draw-path"
        d="M120.07,15.12h32.81v21.81h-23.57v6.4h23.57v8.1h-32.81V15.12ZM129.31,28.83h14.33v-5.54h-14.33v5.54Z"
      />
      <path
        className="draw-path"
        d="M182.76,23.99h-12.66v27.45h-9.24V15.12h52.47v36.32h-9.24v-27.45h-12.11v27.45h-9.24v-27.45Z"
      />
      <path
        className="draw-path"
        d="M219.3.07h9.24v9.69h-9.24V.07ZM219.3,15.12h9.24v36.32h-9.24V15.12Z"
      />
      <path
        className="draw-path"
        d="M234.84,15.12h4.08l.04-15.05h9.24l-.04,15.05h7.87v8.86h-7.87v18.66h7.87v8.79h-17.11v-27.45h-4.08v-8.86Z"
      />
      <path
        className="fill-path"
        d="M0,15.12h32.81v21.81H9.24v6.4h23.57v8.1H0V15.12ZM9.24,28.83h14.33v-5.54h-14.33v5.54Z"
      />
      <path
        className="fill-path"
        d="M63.05,23.93h-12.89v27.45h-9.24V15.07h31.36v36.32h-9.24v-27.45Z"
      />
      <path
        className="fill-path"
        d="M111.65,51.44h-32.81V15.12h23.57V0h9.24v51.44ZM88.08,42.65h14.33v-18.66h-14.33v18.66Z"
      />
      <path
        className="fill-path"
        d="M120.07,15.12h32.81v21.81h-23.57v6.4h23.57v8.1h-32.81V15.12ZM129.31,28.83h14.33v-5.54h-14.33v5.54Z"
      />
      <path
        className="fill-path"
        d="M182.76,23.99h-12.66v27.45h-9.24V15.12h52.47v36.32h-9.24v-27.45h-12.11v27.45h-9.24v-27.45Z"
      />
      <path
        className="fill-path"
        d="M219.3.07h9.24v9.69h-9.24V.07ZM219.3,15.12h9.24v36.32h-9.24V15.12Z"
      />
      <path
        className="fill-path"
        d="M234.84,15.12h4.08l.04-15.05h9.24l-.04,15.05h7.87v8.86h-7.87v18.66h7.87v8.79h-17.11v-27.45h-4.08v-8.86Z"
      />
    </svg>
  );
}
