document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-dots a');
    const skillLevels = document.querySelectorAll('.skill-level');
    
    // Current section index
    let currentIndex = 0;
    let isScrolling = false;
    let touchStartX = 0;
    let touchEndX = 0;
    let isMobile = window.innerWidth <= 768;
    
    // Check for mobile on resize
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
    });
    
    // Initialize
    updateNavigation();
    
    // Handle navigation clicks for nav dots
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToSection(index);
        });
    });
    
    // Handle ALL links that point to sections (including buttons and other anchors)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            // Only handle if it's one of our sections
            if (targetSection && targetSection.classList.contains('section')) {
                e.preventDefault();
                
                // Find the index of the section
                const targetIndex = Array.from(sections).findIndex(section => 
                    section.id === targetId.substring(1));
                    
                if (targetIndex !== -1) {
                    scrollToSection(targetIndex);
                }
            }
        });
    });
    
    // Mouse wheel scrolling
    window.addEventListener('wheel', function(e) {
        if (isScrolling || isMobile) return; // Disable horizontal wheel scrolling on mobile
        
        if (e.deltaY > 0) {
            // Scroll right
            scrollToSection(Math.min(currentIndex + 1, sections.length - 1));
        } else {
            // Scroll left
            scrollToSection(Math.max(currentIndex - 1, 0));
        }
    });
    
    // Touch events for mobile - only use for horizontal swipe on desktop
    document.addEventListener('touchstart', function(e) {
        if (isMobile) return; // Skip on mobile as we're using vertical scrolling
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        if (isScrolling || isMobile) return;
        
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (isScrolling || isMobile) return; // Disable horizontal keyboard nav on mobile
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            scrollToSection(Math.min(currentIndex + 1, sections.length - 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            scrollToSection(Math.max(currentIndex - 1, 0));
        }
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        navLinks.forEach((link, index) => {
            if (link.getAttribute('href') === hash) {
                scrollToSection(index);
            }
        });
    });
    
    // Check if URL has hash on load
    if (window.location.hash) {
        const hash = window.location.hash;
        navLinks.forEach((link, index) => {
            if (link.getAttribute('href') === hash) {
                // Small delay to ensure page is fully loaded
                setTimeout(() => {
                    if (isMobile) {
                        // For mobile, just scroll to the element
                        const targetSection = document.querySelector(hash);
                        if (targetSection) {
                            window.scrollTo({
                                top: targetSection.offsetTop,
                                behavior: 'smooth'
                            });
                            currentIndex = index;
                            updateNavigation();
                        }
                    } else {
                        scrollToSection(index);
                    }
                }, 100);
            }
        });
    }
    
    // Update navigation on scroll for mobile view
    if (isMobile) {
        window.addEventListener('scroll', function() {
            // Find which section is currently most visible
            let currentSectionIndex = 0;
            let maxVisibility = 0;
            
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                // Calculate how much of the section is visible
                const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                const visibilityPercentage = visibleHeight / section.offsetHeight;
                
                if (visibilityPercentage > maxVisibility) {
                    maxVisibility = visibilityPercentage;
                    currentSectionIndex = index;
                }
            });
            
            if (currentIndex !== currentSectionIndex) {
                currentIndex = currentSectionIndex;
                updateNavigation();
                
                // Update URL
                const sectionId = sections[currentIndex].id;
                history.replaceState(null, null, `#${sectionId}`);
            }
        });
    }
    
    // Animation on scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animate skill bars when about section is visible
                if (entry.target.id === 'about') {
                    skillLevels.forEach((skill, index) => {
                        setTimeout(() => {
                            skill.style.transform = 'scaleX(1)';
                        }, index * 200);
                    });
                }
            }
        });
    }, { threshold: 0.2 });
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Handle swipe for touch devices
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (swipeDistance < -swipeThreshold) {
            // Swipe left, go right
            scrollToSection(Math.min(currentIndex + 1, sections.length - 1));
        } else if (swipeDistance > swipeThreshold) {
            // Swipe right, go left
            scrollToSection(Math.max(currentIndex - 1, 0));
        }
    }
    
    // Scroll to specific section
    function scrollToSection(index) {
        if (currentIndex === index || isScrolling) return;
        
        isScrolling = true;
        currentIndex = index;
        
        if (!isMobile) {
            // Update scroll position for desktop (horizontal)
            scrollContainer.style.transform = `translateX(-${index * 25}%)`;
        } else {
            // For mobile, we scroll vertically to the section
            const sectionElement = sections[index];
            window.scrollTo({
                top: sectionElement.offsetTop,
                behavior: 'smooth'
            });
        }
        
        // Update navigation
        updateNavigation();
        
        // Update URL hash without scrolling
        const sectionId = sections[index].id;
        history.replaceState(null, null, `#${sectionId}`);
        
        // Reset isScrolling after animation completes
        setTimeout(() => {
            isScrolling = false;
        }, 800); // Match this with CSS transition time
    }
    
    // Update navigation dots
    function updateNavigation() {
        navLinks.forEach((link, index) => {
            if (index === currentIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Contact form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation logic would go here
            const formElements = contactForm.elements;
            let isValid = true;
            
            for (let i = 0; i < formElements.length; i++) {
                if (formElements[i].required && !formElements[i].value) {
                    isValid = false;
                    formElements[i].classList.add('invalid');
                } else {
                    formElements[i].classList.remove('invalid');
                }
            }
            
            if (isValid) {
                // This would normally send the form data to a server
                alert('Thank you for your message! I will get back to you soon.');
                contactForm.reset();
            }
        });
    }
});
