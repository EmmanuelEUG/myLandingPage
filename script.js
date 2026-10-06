document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const progressBar = document.querySelector('.scroll-progress span');
    const cursorGlow = document.querySelector('.cursor-glow');
    const heroVisual = document.querySelector('.hero-visual');

    const updateProgress = () => {
        const range = root.scrollHeight - window.innerHeight;
        const progress = range > 0 ? window.scrollY / range : 0;
        if (progressBar) progressBar.style.transform = `scaleY(${progress})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
        document.body.classList.add('pointer-active');
        window.addEventListener('pointermove', event => {
            if (cursorGlow) {
                cursorGlow.style.left = `${event.clientX}px`;
                cursorGlow.style.top = `${event.clientY}px`;
            }
            if (heroVisual && window.scrollY < window.innerHeight * 0.9) {
                const bounds = heroVisual.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - 0.5;
                const y = (event.clientY - bounds.top) / bounds.height - 0.5;
                heroVisual.style.setProperty('--pointer-x', `${x * 5}deg`);
                heroVisual.style.setProperty('--pointer-y', `${-y * 5}deg`);
            }
        }, { passive: true });
    }

    if (window.gsap && window.ScrollTrigger && !reducedMotion) {
        gsap.registerPlugin(ScrollTrigger);

        gsap.from('.topbar > *', {
            y: -18,
            opacity: 0,
            duration: 0.85,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.15
        });
        gsap.from('.hero-copy > *', {
            y: 32,
            opacity: 0,
            duration: 1,
            stagger: 0.14,
            ease: 'power3.out',
            delay: 0.2
        });
        gsap.from('.portrait-card', {
            opacity: 0,
            scale: 0.88,
            rotateY: -22,
            duration: 1.35,
            ease: 'expo.out',
            delay: 0.35
        });

        gsap.to('.hero-visual', {
            yPercent: 16,
            rotate: 5,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });
        gsap.to('.hero-copy', {
            yPercent: 20,
            opacity: 0.18,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });

        gsap.utils.toArray('.section-index, .manifesto-kicker, .manifesto-title, .manifesto-bottom, .section-heading, .work-heading, .signal-copy, .credentials-heading, .contact > .eyebrow, .contact-title, .contact > .button, .contact-github').forEach((element, index) => {
            gsap.from(element, {
                y: 38,
                opacity: 0,
                duration: 0.9,
                delay: index % 2 ? 0.06 : 0,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 88%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        gsap.utils.toArray('.skill-tile, .project-card, .event-panel, .credential-list > div').forEach((element, index) => {
            gsap.from(element, {
                y: 44,
                opacity: 0,
                rotateX: 5,
                duration: 0.8,
                delay: (index % 3) * 0.075,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 91%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        gsap.utils.toArray('.scene').forEach((scene, index) => {
            const visual = scene.querySelector('.manifesto-decoration, .skill-tile img, .project-art, .contact-planet');
            if (!visual) return;
            gsap.to(visual, {
                y: index % 2 ? -24 : 22,
                ease: 'none',
                scrollTrigger: {
                    trigger: scene,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.3
                }
            });
        });

        ScrollTrigger.create({
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: self => {
                document.body.style.setProperty('--scroll-progress', self.progress.toFixed(4));
            }
        });
    } else {
        document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
    }

    // Full-screen star system. All objects are point particles; there are no
    // connecting segments. Scroll steers the camera through the spiral arms.
    const canvas = document.querySelector('.universe');
    if (!canvas || reducedMotion) return;

    import('https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js')
        .then(THREE => {
            const isMobile = window.innerWidth < 700;
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: false,
                powerPreference: 'low-power'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.3));
            renderer.setClearColor(0x000000, 0);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
            camera.position.set(0, 0, isMobile ? 24 : 21);
            const galaxy = new THREE.Group();
            scene.add(galaxy);

            const cyan = new THREE.Color('#79e9ee');
            const violet = new THREE.Color('#a78bfa');
            const pink = new THREE.Color('#ef9ac9');
            const pearl = new THREE.Color('#f6eaff');
            const geometries = [];
            const materials = [];
            const pixelToWorld = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(58) / 2))
                / Math.max(window.innerHeight, 1);

            const makePointLayer = (count, options, getParticle) => {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(count * 3);
                const colors = new Float32Array(count * 3);
                const sizes = new Float32Array(count);
                const alphas = new Float32Array(count);

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    const particle = getParticle(i);
                    positions[i3] = particle.x;
                    positions[i3 + 1] = particle.y;
                    positions[i3 + 2] = particle.z;
                    colors[i3] = particle.color.r;
                    colors[i3 + 1] = particle.color.g;
                    colors[i3 + 2] = particle.color.b;
                    sizes[i] = particle.size * pixelToWorld;
                    alphas[i] = particle.alpha;
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
                geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

                const material = new THREE.ShaderMaterial({
                    uniforms: { uOpacity: { value: options.opacity } },
                    vertexShader: `
                        attribute float aSize;
                        attribute float aAlpha;
                        attribute vec3 color;
                        varying vec3 vColor;
                        varying float vAlpha;
                        void main() {
                            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_Position = projectionMatrix * viewPosition;
                            gl_PointSize = clamp(aSize * (20.0 / -viewPosition.z), 1.8, 30.0);
                            vColor = color;
                            vAlpha = aAlpha;
                        }
                    `,
                    fragmentShader: `
                        uniform float uOpacity;
                        varying vec3 vColor;
                        varying float vAlpha;
                        void main() {
                            float r = length(gl_PointCoord - vec2(0.5));
                            float body = 1.0 - smoothstep(0.08, 0.46, r);
                            float halo = exp(-r * r * 23.0) * 0.22;
                            float alpha = (body + halo) * vAlpha * uOpacity;
                            if (alpha < 0.012) discard;
                            gl_FragColor = vec4(vColor, min(alpha, 1.0));
                            #include <tonemapping_fragment>
                            #include <colorspace_fragment>
                        }
                    `,
                    transparent: true,
                    depthWrite: false,
                    blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending
                });
                const points = new THREE.Points(geometry, material);
                galaxy.add(points);
                geometries.push(geometry);
                materials.push(material);
                return points;
            };

            const armCount = isMobile ? 3600 : 8200;
            const arms = makePointLayer(armCount, { opacity: 0.86, additive: true }, index => {
                const arm = index % 4;
                const radius = Math.pow(Math.random(), 0.72) * (isMobile ? 7 : 11.7);
                const angle = arm * Math.PI / 2 + radius * 0.67 + (Math.random() - 0.5) * (0.12 + radius * 0.032);
                const blend = Math.min(radius / (isMobile ? 7 : 11.7), 1);
                const color = blend < 0.57
                    ? cyan.clone().lerp(violet, blend / 0.57)
                    : violet.clone().lerp(pink, (blend - 0.57) / 0.43);
                const bright = Math.random() > 0.89;
                return {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius * 0.65,
                    z: (Math.random() - 0.5) * (0.25 + radius * 0.045),
                    color: bright ? pearl : color,
                    size: bright ? 3.8 + Math.random() * 3 : 1.4 + Math.random() * 2.1,
                    alpha: 0.42 + Math.random() * 0.58
                };
            });

            const core = makePointLayer(isMobile ? 1100 : 2200, { opacity: 0.9, additive: true }, () => {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 2.35) * (isMobile ? 1.45 : 1.9);
                return {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius * 0.82,
                    z: (Math.random() - 0.5) * 0.8,
                    color: Math.random() > 0.28 ? pearl : pink,
                    size: 2 + Math.random() * 5.3,
                    alpha: 0.5 + Math.random() * 0.5
                };
            });

            makePointLayer(isMobile ? 1900 : 3900, { opacity: 0.2, additive: true }, () => {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.sqrt(Math.random()) * (isMobile ? 7 : 11.7);
                const pick = Math.random();
                return {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius * 0.65,
                    z: (Math.random() - 0.5) * 0.4,
                    color: pick < 0.48 ? cyan : pick < 0.83 ? violet : pink,
                    size: 1.1 + Math.random() * 1.8,
                    alpha: 0.18 + Math.random() * 0.5
                };
            });

            makePointLayer(isMobile ? 230 : 460, { opacity: 0.7, additive: false }, () => ({
                x: (Math.random() - 0.5) * (isMobile ? 16 : 33),
                y: (Math.random() - 0.5) * 23,
                z: -4 - Math.random() * 8,
                color: Math.random() > 0.66 ? violet : cyan,
                size: 1.2 + Math.random() * 2.1,
                alpha: 0.38 + Math.random() * 0.55
            }));

            const centerGlowCanvas = document.createElement('canvas');
            centerGlowCanvas.width = 256;
            centerGlowCanvas.height = 256;
            const glowContext = centerGlowCanvas.getContext('2d');
            const glowGradient = glowContext.createRadialGradient(128, 128, 1, 128, 128, 128);
            glowGradient.addColorStop(0, 'rgba(247, 234, 255, .85)');
            glowGradient.addColorStop(.14, 'rgba(167, 139, 250, .55)');
            glowGradient.addColorStop(.43, 'rgba(103, 232, 249, .16)');
            glowGradient.addColorStop(1, 'rgba(103, 232, 249, 0)');
            glowContext.fillStyle = glowGradient;
            glowContext.fillRect(0, 0, 256, 256);
            const glowTexture = new THREE.CanvasTexture(centerGlowCanvas);
            const glowMaterial = new THREE.SpriteMaterial({
                map: glowTexture,
                transparent: true,
                opacity: .7,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const centerGlow = new THREE.Sprite(glowMaterial);
            centerGlow.scale.set(isMobile ? 5 : 7.5, isMobile ? 5 : 7.5, 1);
            centerGlow.position.z = .25;
            galaxy.add(centerGlow);

            const resize = () => {
                renderer.setSize(window.innerWidth, window.innerHeight, false);
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            };
            resize();
            window.addEventListener('resize', resize, { passive: true });

            let scrollProgress = 0;
            let pointerX = 0;
            let pointerY = 0;
            const setScroll = progress => { scrollProgress = progress; };
            const onPointerMove = event => {
                pointerX = (event.clientX / window.innerWidth - .5) * .34;
                pointerY = (event.clientY / window.innerHeight - .5) * .24;
            };
            window.addEventListener('pointermove', onPointerMove, { passive: true });

            if (window.gsap && window.ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
                ScrollTrigger.create({
                    trigger: document.documentElement,
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: self => setScroll(self.progress)
                });
            } else {
                let ticking = false;
                window.addEventListener('scroll', () => {
                    if (ticking) return;
                    ticking = true;
                    requestAnimationFrame(() => {
                        const distance = document.documentElement.scrollHeight - window.innerHeight;
                        setScroll(distance > 0 ? window.scrollY / distance : 0);
                        ticking = false;
                    });
                }, { passive: true });
            }

            let frameId;
            const render = time => {
                frameId = requestAnimationFrame(render);
                const progress = scrollProgress;
                galaxy.rotation.z = -.22 + progress * .85 + Math.sin(time * .00007) * .018;
                galaxy.rotation.x += (.18 - pointerY * .12 - galaxy.rotation.x) * .012;
                galaxy.rotation.y += (pointerX * .12 + Math.sin(time * .00005) * .025 - galaxy.rotation.y) * .012;
                galaxy.position.y = Math.sin(progress * Math.PI * 2) * 1.1;
                camera.position.z = (isMobile ? 24 : 21) - progress * (isMobile ? 3.4 : 4.6);
                camera.position.x = Math.sin(progress * Math.PI * 2) * .68 + pointerX * .24;
                camera.position.y = Math.cos(progress * Math.PI * 2) * .42 + pointerY * .2;
                camera.lookAt(0, 0, 0);
                arms.material.uniforms.uOpacity.value = .76 + (Math.sin(time * .001) + 1) * .08;
                core.material.uniforms.uOpacity.value = .78 + (Math.sin(time * .0015) + 1) * .1;
                renderer.render(scene, camera);
            };
            render(0);

            window.addEventListener('pagehide', () => {
                cancelAnimationFrame(frameId);
                window.removeEventListener('resize', resize);
                window.removeEventListener('pointermove', onPointerMove);
                geometries.forEach(geometry => geometry.dispose());
                materials.forEach(material => material.dispose());
                glowTexture.dispose();
                glowMaterial.dispose();
                renderer.dispose();
            }, { once: true });
        })
        .catch(error => console.info('Galaxy background unavailable; keeping CSS atmosphere.', error));
});
