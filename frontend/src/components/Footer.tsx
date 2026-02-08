const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner mt-12">
      <div className="container mx-auto px-6 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
        © {new Date().getFullYear()} MPT Engine. All rights reserved.
        <a
          href="https://github.com/AndrewBrickweg/modern-portfolio-theory-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-blue-600 dark:text-blue-800 hover:underline"
        >
          Source Code: github.com/AndrewBrickweg/modern-portfolio-theory-engine
        </a>
      </div>
    </footer>
  );
};

export default Footer;
