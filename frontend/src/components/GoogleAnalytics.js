import React from "react";
import { Helmet } from "react-helmet";

const GoogleAnalytics = () => {
  return (
    <Helmet>
      {/* Google Tag (gtag.js) - DO NOT USE IN YOUR PROJECT */}
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-RZBP95EQ7L"
      ></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-RZBP95EQ7L');
        `}
      </script>
    </Helmet>
  );
};

export default GoogleAnalytics;
