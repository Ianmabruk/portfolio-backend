#!/usr/bin/env node
const { db } = require('../config/database');

// Fix services - delete and reinsert with correct active values
db.prepare("DELETE FROM services").run();

const services = [
  ['Web Development', 'web-development', 'Modern responsive websites and web applications built with cutting-edge technologies.', null, null, 1, 1, 1],
  ['Software Development', 'software-development', 'Custom software designed around your business requirements and goals.', null, null, 1, 1, 2],
  ['UI/UX Design', 'ui-ux-design', 'Clean, intuitive digital experiences that delight users and drive engagement.', null, null, 0, 1, 3],
  ['Mobile Apps', 'mobile-apps', 'Mobile-first digital products and applications for iOS and Android.', null, null, 0, 1, 4],
  ['Digital Marketing', 'digital-marketing', 'Strategic marketing solutions to grow your online presence and reach.', null, null, 1, 1, 5],
  ['Graphics Design', 'graphics-design', 'Visual design solutions that strengthen your brand identity and communicate your message.', null, null, 1, 1, 6],
];

const insertService = db.prepare('INSERT OR IGNORE INTO services (title, slug, description, icon, image, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
services.forEach(s => insertService.run(...s));

// Fix project active values
db.prepare("UPDATE portfolio_projects SET active = 1 WHERE id IN (2, 3)").run();

// Fix service content
const serviceContent = {
  'web-development': `
    <h3>Professional Web Development for Modern Businesses</h3>
    <p>A professional website provides your business with a digital presence that is accessible to customers around the clock. It serves as a central place where potential clients can learn about your products, services, values, and contact information. In today's digital landscape, a well-designed website is often the first interaction a customer has with your brand.</p>
    <h3>Why Web Development Matters</h3>
    <p>Your website is the foundation of your digital identity. It supports lead generation, customer communication, and brand credibility. A professionally built website integrates with your business tools, supports search engine visibility, and provides measurable analytics to guide growth.</p>
    <h3>Who Benefits</h3>
    <p>Established businesses, startups, small businesses, and organizations all benefit from a strong web presence. Whether you need an informational site, an e-commerce platform, or a web application, professional development ensures reliability, performance, and scalability.</p>
    <h3>What Mabrix Provides</h3>
    <p>We design and build responsive, accessible, and high-performance websites. Our process includes planning, design, development, testing, and launch. We build with modern technologies and ensure your site integrates with your existing workflows and tools.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>Professional web development ensures your site loads quickly, works across devices, follows accessibility standards, and supports your long-term business goals. A well-built website creates trust, improves conversion, and gives you a competitive edge online.</p>
  `,
  'software-development': `
    <h3>Custom Software Development</h3>
    <p>Custom software helps businesses automate repetitive processes, manage information effectively, and improve internal workflows. Whether you need a dashboard, a management tool, or an integration layer, custom software connects systems and reduces manual work.</p>
    <h3>Why It Matters</h3>
    <p>Off-the-shelf software rarely fits every requirement. Custom solutions are built around your actual business processes, ensuring they support the way your team works. This leads to better adoption, fewer workarounds, and improved operational visibility.</p>
    <h3>Who Benefits</h3>
    <p>Teams that need workflow automation, data management, reporting dashboards, or system integration benefit most. Startups, SMBs, and enterprises all use custom software to solve specific challenges.</p>
    <h3>What Mabrix Provides</h3>
    <p>We build business-specific tools, dashboards, and APIs. Our approach includes requirements gathering, architecture design, development, testing, and deployment. We integrate with third-party services and ensure the solution scales with your needs.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>The right software solution depends on your organization's requirements. Professional implementation ensures security, performance, maintainability, and alignment with your business goals. Poorly built software creates technical debt; well-built software creates competitive advantage.</p>
  `,
  'ui-ux-design': `
    <h3>UI/UX Design That Puts Users First</h3>
    <p>User interface and user experience design encompasses user research, information architecture, user flows, wireframes, interface design, responsive design, usability, accessibility, prototyping, and consistency. A well-designed interface makes digital products easier to understand, navigate, and use.</p>
    <h3>Why It Matters</h3>
    <p>Users expect intuitive, polished experiences. Poor design leads to frustration, abandonment, and lost opportunities. Good design improves engagement, satisfaction, and conversion across web and mobile products.</p>
    <h3>Who Benefits</h3>
    <p>Any business with a digital product benefits from UI/UX design. Startups validating concepts, growing companies scaling products, and enterprises modernizing platforms all need user-centered design.</p>
    <h3>What Mabrix Provides</h3>
    <p>We conduct user research, build information architectures, design wireframes and prototypes, create responsive interfaces, and ensure accessibility. Every design decision is informed by user needs and business goals.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>Professional design is not just about aesthetics. It is about creating products that work for real people in real contexts. Properly executed UI/UX design reduces development waste, improves user satisfaction, and increases product success rates.</p>
  `,
  'mobile-apps': `
    <h3>Mobile Applications That Reach Customers Anywhere</h3>
    <p>Mobile applications provide convenient access to services and workflows for both customers and staff. We develop for Android and iOS, and use cross-platform approaches where appropriate. Mobile-first experiences prioritize speed, simplicity, and offline capability.</p>
    <h3>Why It Matters</h3>
    <p>Mobile usage continues to grow. An app can provide customers with quick access to your services, streamlined authentication, real-time notifications, and integrated payments. For staff, mobile apps improve field operations and communication.</p>
    <h3>Who Benefits</h3>
    <p>Businesses that serve customers on mobile, manage field teams, or need internal tools benefit from mobile applications. Retail, service, healthcare, and logistics sectors see strong returns from well-built apps.</p>
    <h3>What Mabrix Provides</h3>
    <p>We design and develop native and cross-platform mobile applications. Our process includes UX planning, API integration, authentication, push notifications, payment integration, and quality testing across devices.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>Professional mobile development ensures your app is secure, performant, and provides a consistent experience across devices and OS versions. A well-built app strengthens customer relationships and operational efficiency.</p>
  `,
  'digital-marketing': `
    <h3>Digital Marketing That Drives Growth</h3>
    <p>Digital marketing includes social media strategy, content creation, search visibility, paid campaigns, audience targeting, conversion-focused landing pages, analytics, brand consistency, and digital customer acquisition. A strategic approach helps businesses reach the right audience at the right time.</p>
    <h3>Why It Matters</h3>
    <p>Online discovery is how most customers find businesses today. Strategic digital marketing builds awareness, generates qualified leads, and supports revenue growth. Data-driven campaigns allow continuous optimization.</p>
    <h3>Who Benefits</h3>
    <p>Any business seeking online growth benefits from digital marketing. Startups building awareness, local businesses attracting customers, and enterprises scaling campaigns all need a strategic marketing presence.</p>
    <h3>What Mabrix Provides</h3>
    <p>We develop social media strategies, create content, optimize for search visibility, design landing pages, set up campaigns, and analyze performance. Our approach focuses on measurable outcomes aligned with your business objectives.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>Professional digital marketing avoids wasted spend and ensures brand consistency. It requires expertise in platforms, audiences, and measurement. A well-executed strategy delivers sustainable growth rather than short-term spikes.</p>
  `,
  'graphics-design': `
    <h3>Graphics Design That Strengthens Your Brand</h3>
    <p>Graphics design covers brand identity, logos, social media graphics, marketing materials, promotional graphics, digital advertisements, business presentations, visual consistency, and marketing assets. Strong visual design creates recognition and trust across every touchpoint.</p>
    <h3>Why It Matters</h3>
    <p>Visual consistency builds brand recognition. Professional graphics ensure your brand looks cohesive whether on social media, in print, or in presentations. High-quality visuals communicate professionalism and credibility.</p>
    <h3>Who Benefits</h3>
    <p>Businesses that need a cohesive visual identity benefit from graphics design. Startups defining brands, companies refreshing their image, and organizations with ongoing marketing needs all rely on professional design.</p>
    <h3>What Mabrix Provides</h3>
    <p>We create brand identity packages, logos, social media templates, marketing collateral, promotional materials, digital ads, and presentation designs. Every asset aligns with your brand guidelines and business goals.</p>
    <h3>Why Professional Implementation Matters</h3>
    <p>Professional design ensures visual consistency, proper formatting for each medium, and adherence to brand standards. Well-designed materials improve communication effectiveness and leave lasting impressions on your audience.</p>
  `,
};

const updateContent = db.prepare('UPDATE services SET content = ? WHERE slug = ?');
for (const [slug, content] of Object.entries(serviceContent)) {
  updateContent.run(content, slug);
}

console.log('Database fix completed successfully');
