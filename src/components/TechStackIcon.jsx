import PropTypes from "prop-types";

const TechStackIcon = ({ TechStackIcon, Language }) => (
  <div className="group relative flex h-full cursor-default items-center gap-2.5 overflow-hidden px-3 py-3 transition-all duration-300 ease-out hover:bg-murekkep sm:gap-3 sm:px-5 sm:py-5">
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-kayisi transition-transform duration-300 ease-out group-hover:scale-y-100"
    />
    <img
      src={`/${TechStackIcon}`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="h-6 w-6 shrink-0 object-contain transition-transform duration-300 ease-out group-hover:scale-110 sm:h-7 sm:w-7"
    />
    <span className="text-sm leading-tight text-kar transition-colors duration-300 group-hover:text-kayisi sm:text-[15px]">
      {Language}
    </span>
  </div>
);

export default TechStackIcon;

TechStackIcon.propTypes = {
  TechStackIcon: PropTypes.string.isRequired,
  Language: PropTypes.string.isRequired,
};
