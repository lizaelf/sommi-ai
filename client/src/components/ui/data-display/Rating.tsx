import React from "react";

interface RatingProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const Rating = React.forwardRef<HTMLElement, RatingProps>(
  ({ children, className = "", style = {}, "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={className}
        role="group"
        aria-label={ariaLabel || "Ratings"}
        style={style}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Rating.displayName = "Rating";

export { Rating };
export default Rating;