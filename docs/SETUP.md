To run:
Clone the github onto your local machine 
1) First open a terminal and cd into backend
    pip install passlib[bcrypt]
    pip install fastapi uvicorn pydantic passlib jwt bcrypt PyPDF2 pymupdf
    run using fastapi run app.py [uvicorn app:app --reload]

2) Open another terminal and cd into frontend
    npm install vite --save-dev
    npx vite
    npm install @react-pdf-viewer/core@^3.12.0 @react-pdf-viewer/default-layout@^3.12.0 pdfjs-dist@^4.8.69 react@^18.3.1 react-dom@^18.3.1 react-pdf@^9.1.1 react-router-dom@^6.28.0

    npm install --save-dev @eslint/js@^9.13.0 @types/react@^18.3.12 @types/react-dom@^18.3.1 @vitejs/plugin-react@^4.3.3 eslint@^9.13.0 eslint-plugin-react@^7.37.2 eslint-plugin-react-hooks@^5.0.0 eslint-plugin-react-refresh@^0.4.14 globals@^15.11.0 vite@^5.4.11
    
    or install all dependencies in the package.json using npm install
    run using npm run dev

3) open the local site 