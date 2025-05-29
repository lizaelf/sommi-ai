import { X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Background.png";
import wineBottleImage from "@assets/Product Image.png";
import usFlagImage from "@assets/US-flag.png";
import logoImage from "@assets/Logo.png";
import lineImage from "@assets/line.png";

const Cellar = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(() => {
    // Only show modal automatically if user hasn't shared contact AND hasn't closed it before
    const hasShared = localStorage.getItem('hasSharedContact') === 'true';
    const hasClosed = localStorage.getItem('hasClosedContactForm') === 'true';
    return !hasShared && !hasClosed;
  });
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [animationState, setAnimationState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [selectedCountry, setSelectedCountry] = useState({
    dial_code: "+1",
    flag: "🇺🇸",
    name: "United States",
    code: "US",
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [wineSearchQuery, setWineSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    // Check localStorage for saved contact sharing status
    return localStorage.getItem('hasSharedContact') === 'true';
  });
  
  const [hasClosedContactForm, setHasClosedContactForm] = useState(() => {
    // Check if user has previously closed the contact form
    return localStorage.getItem('hasClosedContactForm') === 'true';
  });

  const countries = [
    { name: "Afghanistan", dial_code: "+93", code: "AF", flag: "🇦🇫" },
    { name: "Albania", dial_code: "+355", code: "AL", flag: "🇦🇱" },
    { name: "Algeria", dial_code: "+213", code: "DZ", flag: "🇩🇿" },
    { name: "Andorra", dial_code: "+376", code: "AD", flag: "🇦🇩" },
    { name: "Angola", dial_code: "+244", code: "AO", flag: "🇦🇴" },
    {
      name: "Antigua and Barbuda",
      dial_code: "+1-268",
      code: "AG",
      flag: "🇦🇬",
    },
    { name: "Argentina", dial_code: "+54", code: "AR", flag: "🇦🇷" },
    { name: "Armenia", dial_code: "+374", code: "AM", flag: "🇦🇲" },
    { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
    { name: "Austria", dial_code: "+43", code: "AT", flag: "🇦🇹" },
    { name: "Azerbaijan", dial_code: "+994", code: "AZ", flag: "🇦🇿" },
    { name: "Bahamas", dial_code: "+1-242", code: "BS", flag: "🇧🇸" },
    { name: "Bahrain", dial_code: "+973", code: "BH", flag: "🇧🇭" },
    { name: "Bangladesh", dial_code: "+880", code: "BD", flag: "🇧🇩" },
    { name: "Barbados", dial_code: "+1-246", code: "BB", flag: "🇧🇧" },
    { name: "Belarus", dial_code: "+375", code: "BY", flag: "🇧🇾" },
    { name: "Belgium", dial_code: "+32", code: "BE", flag: "🇧🇪" },
    { name: "Belize", dial_code: "+501", code: "BZ", flag: "🇧🇿" },
    { name: "Benin", dial_code: "+229", code: "BJ", flag: "🇧🇯" },
    { name: "Bhutan", dial_code: "+975", code: "BT", flag: "🇧🇹" },
    { name: "Bolivia", dial_code: "+591", code: "BO", flag: "🇧🇴" },
    {
      name: "Bosnia and Herzegovina",
      dial_code: "+387",
      code: "BA",
      flag: "🇧🇦",
    },
    { name: "Botswana", dial_code: "+267", code: "BW", flag: "🇧🇼" },
    { name: "Brazil", dial_code: "+55", code: "BR", flag: "🇧🇷" },
    { name: "Brunei", dial_code: "+673", code: "BN", flag: "🇧🇳" },
    { name: "Bulgaria", dial_code: "+359", code: "BG", flag: "🇧🇬" },
    { name: "Burkina Faso", dial_code: "+226", code: "BF", flag: "🇧🇫" },
    { name: "Burundi", dial_code: "+257", code: "BI", flag: "🇧🇮" },
    { name: "Cambodia", dial_code: "+855", code: "KH", flag: "🇰🇭" },
    { name: "Cameroon", dial_code: "+237", code: "CM", flag: "🇨🇲" },
    { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
    { name: "Cape Verde", dial_code: "+238", code: "CV", flag: "🇨🇻" },
    {
      name: "Central African Republic",
      dial_code: "+236",
      code: "CF",
      flag: "🇨🇫",
    },
    { name: "Chad", dial_code: "+235", code: "TD", flag: "🇹🇩" },
    { name: "Chile", dial_code: "+56", code: "CL", flag: "🇨🇱" },
    { name: "China", dial_code: "+86", code: "CN", flag: "🇨🇳" },
    { name: "Colombia", dial_code: "+57", code: "CO", flag: "🇨🇴" },
    { name: "Comoros", dial_code: "+269", code: "KM", flag: "🇰🇲" },
    { name: "Congo (Brazzaville)", dial_code: "+242", code: "CG", flag: "🇨🇬" },
    { name: "Congo (Kinshasa)", dial_code: "+243", code: "CD", flag: "🇨🇩" },
    { name: "Costa Rica", dial_code: "+506", code: "CR", flag: "🇨🇷" },
    { name: "Croatia", dial_code: "+385", code: "HR", flag: "🇭🇷" },
    { name: "Cuba", dial_code: "+53", code: "CU", flag: "🇨🇺" },
    { name: "Cyprus", dial_code: "+357", code: "CY", flag: "🇨🇾" },
    { name: "Czech Republic", dial_code: "+420", code: "CZ", flag: "🇨🇿" },
    { name: "Denmark", dial_code: "+45", code: "DK", flag: "🇩🇰" },
    { name: "Djibouti", dial_code: "+253", code: "DJ", flag: "🇩🇯" },
    { name: "Dominica", dial_code: "+1-767", code: "DM", flag: "🇩🇲" },
    { name: "Dominican Republic", dial_code: "+1-809", code: "DO", flag: "🇩🇴" },
    { name: "Ecuador", dial_code: "+593", code: "EC", flag: "🇪🇨" },
    { name: "Egypt", dial_code: "+20", code: "EG", flag: "🇪🇬" },
    { name: "El Salvador", dial_code: "+503", code: "SV", flag: "🇸🇻" },
    { name: "Equatorial Guinea", dial_code: "+240", code: "GQ", flag: "🇬🇶" },
    { name: "Eritrea", dial_code: "+291", code: "ER", flag: "🇪🇷" },
    { name: "Estonia", dial_code: "+372", code: "EE", flag: "🇪🇪" },
    { name: "Ethiopia", dial_code: "+251", code: "ET", flag: "🇪🇹" },
    { name: "Fiji", dial_code: "+679", code: "FJ", flag: "🇫🇯" },
    { name: "Finland", dial_code: "+358", code: "FI", flag: "🇫🇮" },
    { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
    { name: "Gabon", dial_code: "+241", code: "GA", flag: "🇬🇦" },
    { name: "Gambia", dial_code: "+220", code: "GM", flag: "🇬🇲" },
    { name: "Georgia", dial_code: "+995", code: "GE", flag: "🇬🇪" },
    { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
    { name: "Ghana", dial_code: "+233", code: "GH", flag: "🇬🇭" },
    { name: "Greece", dial_code: "+30", code: "GR", flag: "🇬🇷" },
    { name: "Grenada", dial_code: "+1-473", code: "GD", flag: "🇬🇩" },
    { name: "Guatemala", dial_code: "+502", code: "GT", flag: "🇬🇹" },
    { name: "Guinea", dial_code: "+224", code: "GN", flag: "🇬🇳" },
    { name: "Guinea-Bissau", dial_code: "+245", code: "GW", flag: "🇬🇼" },
    { name: "Guyana", dial_code: "+592", code: "GY", flag: "🇬🇾" },
    { name: "Haiti", dial_code: "+509", code: "HT", flag: "🇭🇹" },
    { name: "Honduras", dial_code: "+504", code: "HN", flag: "🇭🇳" },
    { name: "Hungary", dial_code: "+36", code: "HU", flag: "🇭🇺" },
    { name: "Iceland", dial_code: "+354", code: "IS", flag: "🇮🇸" },
    { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
    { name: "Indonesia", dial_code: "+62", code: "ID", flag: "🇮🇩" },
    { name: "Iran", dial_code: "+98", code: "IR", flag: "🇮🇷" },
    { name: "Iraq", dial_code: "+964", code: "IQ", flag: "🇮🇶" },
    { name: "Ireland", dial_code: "+353", code: "IE", flag: "🇮🇪" },
    { name: "Israel", dial_code: "+972", code: "IL", flag: "🇮🇱" },
    { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
    { name: "Jamaica", dial_code: "+1-876", code: "JM", flag: "🇯🇲" },
    { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
    { name: "Jordan", dial_code: "+962", code: "JO", flag: "🇯🇴" },
    { name: "Kazakhstan", dial_code: "+7", code: "KZ", flag: "🇰🇿" },
    { name: "Kenya", dial_code: "+254", code: "KE", flag: "🇰🇪" },
    { name: "Kiribati", dial_code: "+686", code: "KI", flag: "🇰🇮" },
    { name: "Kuwait", dial_code: "+965", code: "KW", flag: "🇰🇼" },
    { name: "Kyrgyzstan", dial_code: "+996", code: "KG", flag: "🇰🇬" },
    { name: "Laos", dial_code: "+856", code: "LA", flag: "🇱🇦" },
    { name: "Latvia", dial_code: "+371", code: "LV", flag: "🇱🇻" },
    { name: "Lebanon", dial_code: "+961", code: "LB", flag: "🇱🇧" },
    { name: "Lesotho", dial_code: "+266", code: "LS", flag: "🇱🇸" },
    { name: "Liberia", dial_code: "+231", code: "LR", flag: "🇱🇷" },
    { name: "Libya", dial_code: "+218", code: "LY", flag: "🇱🇾" },
    { name: "Liechtenstein", dial_code: "+423", code: "LI", flag: "🇱🇮" },
    { name: "Lithuania", dial_code: "+370", code: "LT", flag: "🇱🇹" },
    { name: "Luxembourg", dial_code: "+352", code: "LU", flag: "🇱🇺" },
    { name: "Madagascar", dial_code: "+261", code: "MG", flag: "🇲🇬" },
    { name: "Malawi", dial_code: "+265", code: "MW", flag: "🇲🇼" },
    { name: "Malaysia", dial_code: "+60", code: "MY", flag: "🇲🇾" },
    { name: "Maldives", dial_code: "+960", code: "MV", flag: "🇲🇻" },
    { name: "Mali", dial_code: "+223", code: "ML", flag: "🇲🇱" },
    { name: "Malta", dial_code: "+356", code: "MT", flag: "🇲🇹" },
    { name: "Marshall Islands", dial_code: "+692", code: "MH", flag: "🇲🇭" },
    { name: "Mauritania", dial_code: "+222", code: "MR", flag: "🇲🇷" },
    { name: "Mauritius", dial_code: "+230", code: "MU", flag: "🇲🇺" },
    { name: "Mexico", dial_code: "+52", code: "MX", flag: "🇲🇽" },
    { name: "Micronesia", dial_code: "+691", code: "FM", flag: "🇫🇲" },
    { name: "Moldova", dial_code: "+373", code: "MD", flag: "🇲🇩" },
    { name: "Monaco", dial_code: "+377", code: "MC", flag: "🇲🇨" },
    { name: "Mongolia", dial_code: "+976", code: "MN", flag: "🇲🇳" },
    { name: "Montenegro", dial_code: "+382", code: "ME", flag: "🇲🇪" },
    { name: "Morocco", dial_code: "+212", code: "MA", flag: "🇲🇦" },
    { name: "Mozambique", dial_code: "+258", code: "MZ", flag: "🇲🇿" },
    { name: "Myanmar", dial_code: "+95", code: "MM", flag: "🇲🇲" },
    { name: "Namibia", dial_code: "+264", code: "NA", flag: "🇳🇦" },
    { name: "Nauru", dial_code: "+674", code: "NR", flag: "🇳🇷" },
    { name: "Nepal", dial_code: "+977", code: "NP", flag: "🇳🇵" },
    { name: "Netherlands", dial_code: "+31", code: "NL", flag: "🇳🇱" },
    { name: "New Zealand", dial_code: "+64", code: "NZ", flag: "🇳🇿" },
    { name: "Nicaragua", dial_code: "+505", code: "NI", flag: "🇳🇮" },
    { name: "Niger", dial_code: "+227", code: "NE", flag: "🇳🇪" },
    { name: "Nigeria", dial_code: "+234", code: "NG", flag: "🇳🇬" },
    { name: "North Korea", dial_code: "+850", code: "KP", flag: "🇰🇵" },
    { name: "North Macedonia", dial_code: "+389", code: "MK", flag: "🇲🇰" },
    { name: "Norway", dial_code: "+47", code: "NO", flag: "🇳🇴" },
    { name: "Oman", dial_code: "+968", code: "OM", flag: "🇴🇲" },
    { name: "Pakistan", dial_code: "+92", code: "PK", flag: "🇵🇰" },
    { name: "Palau", dial_code: "+680", code: "PW", flag: "🇵🇼" },
    { name: "Panama", dial_code: "+507", code: "PA", flag: "🇵🇦" },
    { name: "Papua New Guinea", dial_code: "+675", code: "PG", flag: "🇵🇬" },
    { name: "Paraguay", dial_code: "+595", code: "PY", flag: "🇵🇾" },
    { name: "Peru", dial_code: "+51", code: "PE", flag: "🇵🇪" },
    { name: "Philippines", dial_code: "+63", code: "PH", flag: "🇵🇭" },
    { name: "Poland", dial_code: "+48", code: "PL", flag: "🇵🇱" },
    { name: "Portugal", dial_code: "+351", code: "PT", flag: "🇵🇹" },
    { name: "Qatar", dial_code: "+974", code: "QA", flag: "🇶🇦" },
    { name: "Romania", dial_code: "+40", code: "RO", flag: "🇷🇴" },
    { name: "Russia", dial_code: "+7", code: "RU", flag: "🇷🇺" },
    { name: "Rwanda", dial_code: "+250", code: "RW", flag: "🇷🇼" },
    {
      name: "Saint Kitts and Nevis",
      dial_code: "+1-869",
      code: "KN",
      flag: "🇰🇳",
    },
    { name: "Saint Lucia", dial_code: "+1-758", code: "LC", flag: "🇱🇨" },
    {
      name: "Saint Vincent and the Grenadines",
      dial_code: "+1-784",
      code: "VC",
      flag: "🇻🇨",
    },
    { name: "Samoa", dial_code: "+685", code: "WS", flag: "🇼🇸" },
    { name: "San Marino", dial_code: "+378", code: "SM", flag: "🇸🇲" },
    { name: "Saudi Arabia", dial_code: "+966", code: "SA", flag: "🇸🇦" },
    { name: "Senegal", dial_code: "+221", code: "SN", flag: "🇸🇳" },
    { name: "Serbia", dial_code: "+381", code: "RS", flag: "🇷🇸" },
    { name: "Seychelles", dial_code: "+248", code: "SC", flag: "🇸🇨" },
    { name: "Sierra Leone", dial_code: "+232", code: "SL", flag: "🇸🇱" },
    { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
    { name: "Slovakia", dial_code: "+421", code: "SK", flag: "🇸🇰" },
    { name: "Slovenia", dial_code: "+386", code: "SI", flag: "🇸🇮" },
    { name: "Solomon Islands", dial_code: "+677", code: "SB", flag: "🇸🇧" },
    { name: "Somalia", dial_code: "+252", code: "SO", flag: "🇸🇴" },
    { name: "South Africa", dial_code: "+27", code: "ZA", flag: "🇿🇦" },
    { name: "South Korea", dial_code: "+82", code: "KR", flag: "🇰🇷" },
    { name: "South Sudan", dial_code: "+211", code: "SS", flag: "🇸🇸" },
    { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
    { name: "Sri Lanka", dial_code: "+94", code: "LK", flag: "🇱🇰" },
    { name: "Sudan", dial_code: "+249", code: "SD", flag: "🇸🇩" },
    { name: "Suriname", dial_code: "+597", code: "SR", flag: "🇸🇷" },
    { name: "Sweden", dial_code: "+46", code: "SE", flag: "🇸🇪" },
    { name: "Switzerland", dial_code: "+41", code: "CH", flag: "🇨🇭" },
    { name: "Syria", dial_code: "+963", code: "SY", flag: "🇸🇾" },
    { name: "Taiwan", dial_code: "+886", code: "TW", flag: "🇹🇼" },
    { name: "Tajikistan", dial_code: "+992", code: "TJ", flag: "🇹🇯" },
    { name: "Tanzania", dial_code: "+255", code: "TZ", flag: "🇹🇿" },
    { name: "Thailand", dial_code: "+66", code: "TH", flag: "🇹🇭" },
    { name: "Togo", dial_code: "+228", code: "TG", flag: "🇹🇬" },
    { name: "Tonga", dial_code: "+676", code: "TO", flag: "🇹🇴" },
    {
      name: "Trinidad and Tobago",
      dial_code: "+1-868",
      code: "TT",
      flag: "🇹🇹",
    },
    { name: "Tunisia", dial_code: "+216", code: "TN", flag: "🇹🇳" },
    { name: "Turkey", dial_code: "+90", code: "TR", flag: "🇹🇷" },
    { name: "Turkmenistan", dial_code: "+993", code: "TM", flag: "🇹🇲" },
    { name: "Tuvalu", dial_code: "+688", code: "TV", flag: "🇹🇻" },
    { name: "Uganda", dial_code: "+256", code: "UG", flag: "🇺🇬" },
    { name: "Ukraine", dial_code: "+380", code: "UA", flag: "🇺🇦" },
    { name: "United Arab Emirates", dial_code: "+971", code: "AE", flag: "🇦🇪" },
    { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
    { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
    { name: "Uruguay", dial_code: "+598", code: "UY", flag: "🇺🇾" },
    { name: "Uzbekistan", dial_code: "+998", code: "UZ", flag: "🇺🇿" },
    { name: "Vanuatu", dial_code: "+678", code: "VU", flag: "🇻🇺" },
    { name: "Vatican City", dial_code: "+39", code: "VA", flag: "🇻🇦" },
    { name: "Venezuela", dial_code: "+58", code: "VE", flag: "🇻🇪" },
    { name: "Vietnam", dial_code: "+84", code: "VN", flag: "🇻🇳" },
    { name: "Yemen", dial_code: "+967", code: "YE", flag: "🇾🇪" },
    { name: "Zambia", dial_code: "+260", code: "ZM", flag: "🇿🇲" },
    { name: "Zimbabwe", dial_code: "+263", code: "ZW", flag: "🇿🇼" },
  ];

  // Filter countries based on search query
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
      country.dial_code.includes(countrySearchQuery),
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });

    // Validate all fields
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Submit to backend
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          countryCode: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Contact saved successfully:", data);
        setHasSharedContact(true); // Mark user as having shared contact info
        localStorage.setItem('hasSharedContact', 'true'); // Persist the choice
        setShowModal(false);
        setAnimationState("closing");
        setTimeout(() => setAnimationState("closed"), 300);

        // Show toast notification
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Select wine to see past info and chats
            </span>
          ),
          duration: 5000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      } else {
        console.error("Failed to save contact:", data);
        // Handle server validation errors if needed
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle network errors
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);
    
    // Mark that user has closed the contact form (so it won't show automatically again)
    setHasClosedContactForm(true);
    localStorage.setItem('hasClosedContactForm', 'true');
    
    // Note: Do NOT set hasSharedContact to true here - only when Save is clicked
  };

  const handleWineClick = (wineId: number) => {
    setLocation(`/wine-details/${wineId}`);
  };

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Portal setup effect
  useEffect(() => {
    let element = document.getElementById("contact-bottom-sheet-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "contact-bottom-sheet-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentElement && !showModal) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Animation state effect
  useEffect(() => {
    if (showModal && animationState === "closed") {
      setAnimationState("opening");
      setTimeout(() => setAnimationState("open"), 50);
    } else if (
      !showModal &&
      (animationState === "open" || animationState === "opening")
    ) {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
    }
  }, [showModal, animationState]);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <style>
        {`
          /* Blinking cursor animation for search input */
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          
          .search-input-active {
            animation: blink 1s infinite;
          }
          
          /* Contact form inputs - transparent when empty */
          .contact-form-input {
            background: transparent !important;
            background-color: transparent !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            
            /* Gradient border */
            border-top: 2px solid transparent !important;
            border-right: 1px solid transparent !important;
            border-bottom: 1px solid transparent !important;
            border-left: 1px solid transparent !important;
            border-radius: 16px !important;
            
            /* Empty state - dark background */
            background-image: 
              linear-gradient(#1C1C1C, #1C1C1C), 
              radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
            background-origin: border-box !important;
            background-clip: padding-box, border-box !important;
            overflow: hidden !important;
          }
          
          /* Filled inputs - 8% white background */
          .contact-form-input:not(:placeholder-shown) {
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), 
              radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
          }
          
          /* Focus state - keep current background */
          .contact-form-input:focus {
            background-image: 
              linear-gradient(#1C1C1C, #1C1C1C), 
              radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
            outline: none !important;
          }
          
          /* Focus state when filled - 8% white background */
          .contact-form-input:focus:not(:placeholder-shown) {
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), 
              radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
          }
          
          .contact-form-input::placeholder {
            color: #959493 !important;
          }
          
          /* Save button - 4% white background */
          .save-button {
            /* Remove all browser styling */
            background: transparent !important;
            background-color: transparent !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            border: none !important;
            
            /* Exact same gradient border as inputs */
            border-top: 2px solid transparent !important;
            border-right: 1px solid transparent !important;
            border-bottom: 1px solid transparent !important;
            border-left: 1px solid transparent !important;
            border-radius: 32px !important;
            
            /* 4% white background with gradient border */
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04)), 
              radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
            background-origin: border-box !important;
            background-clip: padding-box, border-box !important;
            overflow: hidden !important;
          }
          
          /* Override autofill - 8% white background */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.08) inset !important;
            -webkit-text-fill-color: white !important;
          }
        `}
      </style>
      {/* Fixed Header with scroll background */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
          isScrolled
            ? "bg-black/90 backdrop-blur-sm border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <Link href="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="text-white"
          >
            <path
              fill="currentColor"
              d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Cellar</h1>
        <div
          onClick={() => {
            setShowWineSearch(!showWineSearch);
            setIsSearchActive(!showWineSearch);
          }}
          className={`cursor-pointer transition-all duration-200 ${
            showWineSearch
              ? "text-white scale-110"
              : "text-white/80 hover:text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="transition-all duration-200"
          >
            <path
              fill="currentColor"
              d="M15.102 16.162a8 8 0 1 1 1.06-1.06l4.618 4.618a.75.75 0 1 1-1.06 1.06zM16.5 10a6.5 6.5 0 1 0-13 0a6.5 6.5 0 0 0 13 0"
            ></path>
          </svg>
        </div>
      </div>

      {/* Wine Search Interface */}
      {showWineSearch && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "16px",
            right: "16px",
            backgroundColor: "#2A2A29",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "16px",
            zIndex: 1000,
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 2.5a7.5 7.5 0 0 1 5.964 12.048l4.743 4.744a1 1 0 0 1-1.32 1.497l-.094-.083l-4.744-4.743A7.5 7.5 0 1 1 10 2.5Zm0 2a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11Z"
                  fill="#959493"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search wines in cellar..."
              value={wineSearchQuery}
              onChange={(e) => setWineSearchQuery(e.target.value)}
              className=""
              style={{
                width: "100%",
                height: "48px",
                padding: "0 16px 0 48px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "transparent",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "white";
                e.target.style.boxShadow = "0 0 0 2px rgba(255, 255, 255, 0.2)";
                setIsSearchActive(true);
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.target.style.boxShadow = "none";
                setIsSearchActive(false);
              }}
              autoFocus
            />
          </div>

          {/* Search Results */}
          {wineSearchQuery && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)")
                }
                onClick={() => {
                  setShowWineSearch(false);
                  setWineSearchQuery("");
                  handleWineClick(1);
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Sassicaia 2018
                </div>
                <div
                  style={{
                    color: "#CECECE",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  Tuscany, Italy • Cabernet Sauvignon
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content with top padding to account for fixed header */}
      <div className="pt-16">
        {/* Cellar Container with rounded corners */}
        <div
          style={{
            borderRadius: "8px",
            overflow: "hidden",
            margin: "0 16px 0 16px",
          }}
        >
          {/* First Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                onClick={() => handleWineClick(1)}
              >
                <img
                  src={wineBottleImage}
                  alt="Wine bottle"
                  className="object-contain"
                  style={{ height: "186px" }}
                />
              </div>
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(2)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(3)}
              />
            </div>
          </div>

          {/* Second Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(4)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(5)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(6)}
              />
            </div>
          </div>

          {/* Third Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(7)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(8)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(9)}
              />
            </div>
          </div>

          {/* Line separator below last wine rack */}
          <div
            style={{
              backgroundImage: `url(${lineImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "10px",
            }}
          />
        </div>

        {/* Conditional Content Based on Contact Sharing */}
        {!hasSharedContact && (
          /* View Chat History Button when contact not shared */
          <div style={{
            margin: "24px 16px",
            textAlign: "center"
          }}>
            <button
              onClick={() => {
                setShowModal(true);
                setAnimationState("opening");
                setTimeout(() => setAnimationState("open"), 50);
              }}
              style={{
                padding: "12px 24px",
                borderRadius: "24px",
                backgroundColor: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "400",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              View chat history
            </button>
          </div>
        )}

        {/* Contact Info Bottom Sheet */}
        {animationState !== "closed" &&
          portalElement &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 9999,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                opacity:
                  animationState === "open"
                    ? 1
                    : animationState === "opening"
                      ? 0.8
                      : 0,
                transition: "opacity 0.3s ease-out",
              }}
              onClick={handleClose}
            >
              <div
                style={{
                  background:
                    "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
                  backdropFilter: "blur(20px)",
                  width: "100%",
                  maxWidth: "500px",
                  borderRadius: "24px 24px 0px 0px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.20)",
                  paddingTop: "24px",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingBottom: "28px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
                  transform:
                    animationState === "open"
                      ? "translateY(0)"
                      : "translateY(100%)",
                  transition: "transform 0.3s ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                  onClick={handleClose}
                >
                  <X size={24} color="white" />
                </div>

                {/* Header */}
                <div style={{ marginBottom: "24px", marginTop: "0px" }}>
                  <h2
                    style={{
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "20px",
                      fontWeight: 500,
                      textAlign: "center",
                      margin: "0 0 12px 0",
                    }}
                  >
                    Want to see wine history?
                  </h2>

                  <p
                    style={{
                      color: "#CECECE",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.3",
                      textAlign: "center",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Enter your contact info
                  </p>
                </div>

                {/* Form Fields */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "64px",
                      padding: "16px 24px",
                      alignItems: "center",
                      width: "100%",
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.firstName && (
                    <div
                      style={{
                        color: "#ff4444",
                        fontSize: "14px",
                        marginTop: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {errors.firstName}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "64px",
                      padding: "16px 24px",
                      alignItems: "center",
                      width: "100%",
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.lastName && (
                    <div
                      style={{
                        color: "#ff4444",
                        fontSize: "14px",
                        marginTop: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {errors.lastName}
                    </div>
                  )}

                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "64px",
                      padding: "16px 24px",
                      alignItems: "center",
                      width: "100%",
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {errors.email && (
                    <div
                      style={{
                        color: "#ff4444",
                        fontSize: "14px",
                        marginTop: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {errors.email}
                    </div>
                  )}

                  {/* Phone Input Row - Country Selector + Phone Input */}
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    {/* Country Code Selector - 100px Width */}
                    <div style={{ position: "relative", width: "100px" }}>
                      <div
                        onClick={() =>
                          setShowCountryDropdown(!showCountryDropdown)
                        }
                        style={{
                          display: "flex",
                          height: "56px",
                          padding: "16px 12px",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100px",
                          borderRadius: "16px",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "#2A2A29 !important",
                          backgroundColor: "#2A2A29 !important",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>
                            {selectedCountry.flag}
                          </span>
                          <span
                            style={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "14px",
                            }}
                          >
                            {selectedCountry.dial_code}
                          </span>
                        </div>
                      </div>

                      {showCountryDropdown && (
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              backgroundColor: "#2A2A29",
                              borderTopLeftRadius: "16px",
                              borderTopRightRadius: "16px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                            }}
                          >
                            <div
                              style={{
                                padding: "16px 24px",
                                borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.08)",
                                position: "sticky",
                                top: 0,
                                backgroundColor: "#2A2A29",
                                zIndex: 1001,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "16px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "white",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Select Country
                                </span>
                                <div
                                  onClick={() => {
                                    setShowCountryDropdown(false);
                                    setCountrySearchQuery("");
                                  }}
                                  style={{ cursor: "pointer", padding: "8px" }}
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M18 6L6 18M6 6L18 18"
                                      stroke="white"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              </div>

                              {/* Search Input */}
                              <div style={{ position: "relative" }}>
                                <div
                                  style={{
                                    position: "absolute",
                                    left: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 1,
                                  }}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M10 2.5a7.5 7.5 0 0 1 5.964 12.048l4.743 4.744a1 1 0 0 1-1.32 1.497l-.094-.083l-4.744-4.743A7.5 7.5 0 1 1 10 2.5Zm0 2a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11Z"
                                      fill="#959493"
                                    />
                                  </svg>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Search countries..."
                                  value={countrySearchQuery}
                                  onChange={(e) =>
                                    setCountrySearchQuery(e.target.value)
                                  }
                                  style={{
                                    width: "100%",
                                    height: "48px",
                                    padding: "0 16px 0 48px",
                                    borderRadius: "12px",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.12)",
                                    background: "transparent",
                                    color: "white",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "16px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = "white";
                                    e.target.style.boxShadow =
                                      "0 0 0 2px rgba(255, 255, 255, 0.2)";
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor =
                                      "rgba(255, 255, 255, 0.12)";
                                    e.target.style.boxShadow = "none";
                                  }}
                                />
                              </div>
                            </div>
                            {filteredCountries.map((country, index) => (
                              <div
                                key={`${country.code}-${index}`}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                  setCountrySearchQuery("");
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  padding: "16px 24px",
                                  cursor: "pointer",
                                  borderBottom:
                                    index < filteredCountries.length - 1
                                      ? "1px solid rgba(255, 255, 255, 0.08)"
                                      : "none",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.1)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "transparent")
                                }
                              >
                                <span style={{ fontSize: "20px" }}>
                                  {country.flag}
                                </span>
                                <span
                                  style={{
                                    color: "white",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "16px",
                                    minWidth: "50px",
                                  }}
                                >
                                  {country.dial_code}
                                </span>
                                <span
                                  style={{
                                    color: "#CECECE",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "16px",
                                  }}
                                >
                                  {country.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone Input - Right Side */}
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="contact-form-input"
                      style={{
                        display: "flex",
                        height: "56px",
                        padding: "16px 24px",
                        alignItems: "center",
                        flex: 1,
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <div
                      style={{
                        color: "#ff4444",
                        fontSize: "14px",
                        marginTop: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {errors.phone}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <div
                    onClick={handleSave}
                    style={{
                      width: "100%",
                      height: "56px",
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      cursor: "pointer",
                      boxSizing: "border-box",
                      userSelect: "none",

                      /* Simple styling without backgroundImage */
                      borderRadius: "24px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    Save
                  </div>
                </div>
              </div>
            </div>,
            portalElement,
          )}
      </div>
    </div>
  );
};

export default Cellar;
