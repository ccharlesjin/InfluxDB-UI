# **No-Code Solution for InfluxDB Operations**

## **Project Overview**  
This project introduces a **No-Code platform** designed to simplify database operations for **InfluxDB**, catering to users with minimal technical expertise. By replacing complex Flux queries with an intuitive drag-and-drop interface, the platform enhances user experience and efficiency in managing time-series data.

---

## **Key Features**
- **Drag-and-Drop Interface**  
  - Built with **React** and **MUI**, the platform provides an interactive drag-and-drop interface.  
  - Automatically generates Flux queries, reducing the need for manual coding.  

- **Data Visualization**  
  - Integrates **Grafana Dashboards** (via iframe) to deliver real-time data insights and interactions.  

- **Backend Integration**  
  - Powered by **Node.js**, the backend seamlessly interacts with **InfluxDB** and **Grafana APIs** to handle authentication, database operations, and query management.  

- **Security**  
  - Implements **JWT-based authentication** and HTTPS to ensure secure data exchange.  

- **Proxy Module**  
  - A **Node.js reverse proxy** module manages communication between the frontend and backend, enabling secure and efficient cross-origin requests.  

---

## **Tech Stack**
### **Frontend**  
- React, MUI, CSS, HTML  

### **Backend**  
- Node.js, Express  

### **Database**  
- InfluxDB  

### **Tools**  
- Grafana, JWT, Docker, Nginx  

---

## **Highlights**
1. **User-Friendly**  
   - Designed for non-technical users to interact with **InfluxDB** without writing code.  

2. **Efficiency**  
   - Simplifies workflows, reducing manual effort and errors.  

3. **Secure**  
   - Provides secure data interaction through robust authentication and HTTPS protocols.  

---

Feel free to contribute or explore the project! If you have any questions, contact me via zongxijin@qq.com.

---

# How to Run

## Backend
1. Go to Backend directory
2. Run "npm install"
3. Run "npm start"

## Proxy
1. Open another terminal
2. Go to Backend directory
3. Run "node proxy.js"

## Frontend
1. Open another terminal
2. Go to Frontend directory
3. Run "npm install"
4. Run "npm start"

# Others

Remember to start Grafana service before running frontend.\
Watch the demo video in the repository or from YouTube: [Demo Video](https://youtu.be/2_uBunPeDrQ) for more details.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [https://localhost:3000](https://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
