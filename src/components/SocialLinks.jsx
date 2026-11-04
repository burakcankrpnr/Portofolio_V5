import { Github, Instagram, Linkedin } from "lucide-react";

const socialLinks = [
  { name: "LinkedIn", handle: "burakcankorpinar", icon: Linkedin, url: "https://www.linkedin.com/in/burakcankorpinar/" },
  { name: "GitHub", handle: "@burakcankrpnr", icon: Github, url: "https://github.com/burakcankrpnr" },
  { name: "Instagram", handle: "@burakcankorpinar", icon: Instagram, url: "https://www.instagram.com/burakcankorpinar/" },
];

const SocialLinks = () => (
  <ul className="border-t border-cizgi">
    {socialLinks.map(({ name, handle, icon: Icon, url }) => (
      <li key={name} className="border-b border-cizgi">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 py-4"
        >
          <Icon className="h-5 w-5 text-sis transition-colors group-hover:text-kayisi" aria-hidden="true" />
          <span className="text-[17px] text-kar transition-colors group-hover:text-kayisi">{name}</span>
          <span className="ml-auto truncate text-sm text-sis">{handle}</span>
        </a>
      </li>
    ))}
  </ul>
);

export default SocialLinks;
