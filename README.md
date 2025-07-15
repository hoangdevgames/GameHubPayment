# GameHub Payment

A modern React-based payment gateway application designed for gaming platforms. This application provides a secure and user-friendly payment interface that works seamlessly on both desktop and mobile browsers.

## Features

- **Responsive Design**: Optimized for both desktop and mobile devices
- **Secure Payment Processing**: Modern payment form with validation
- **Multiple Payment States**: Success and failure handling pages
- **Modern UI/UX**: Beautiful gradient design with smooth animations
- **Cross-browser Compatibility**: Works on all modern browsers

## Technology Stack

- **React 18**: Latest React with hooks and modern features
- **React Router**: For navigation between pages
- **CSS3**: Modern styling with gradients and animations
- **Axios**: For HTTP requests (ready for API integration)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GameHubPayment
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3001`

### Building for Production

```bash
npm run build
```

### Deployment

```bash
npm run deploy
```

This will build the project and deploy it to GitHub Pages.

## Project Structure

```
GameHubPayment/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── PaymentPage.js
│   │   ├── PaymentPage.css
│   │   ├── PaymentSuccess.js
│   │   ├── PaymentSuccess.css
│   │   ├── PaymentFailed.js
│   │   └── PaymentFailed.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── updateVersion.js
└── README.md
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run deploy`: Builds and deploys to GitHub Pages
- `npm run eject`: Ejects from Create React App (one-way operation)

## Customization

### Styling
The application uses CSS modules and custom CSS. You can modify the styles in the respective `.css` files in the `src/components/` directory.

### Payment Integration
To integrate with real payment processors:
1. Replace the mock payment logic in `PaymentPage.js`
2. Add your payment API endpoints
3. Implement proper error handling
4. Add security measures (HTTPS, token validation, etc.)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@gamehub.com or create an issue in the repository. 
