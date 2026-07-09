const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/App.jsx',
  'src/TicketList.jsx',
  'src/TicketDetails.jsx',
  'src/DashboardCard.jsx'
];

const classMap = {
  'bg-slate-950': 'bg-slate-50 dark:bg-slate-950',
  'bg-slate-900': 'bg-white dark:bg-slate-900',
  'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-400': 'text-slate-600 dark:text-slate-400',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700'
};

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace each class, ensuring we don't double replace
    for (const [darkClass, combinedClasses] of Object.entries(classMap)) {
      // Regex to match the class if it's not already preceded by dark: and not already combined
      const regex = new RegExp(`(?<!dark:)(?<!bg-slate-50 )(?<!bg-white )(?<!bg-slate-100 )(?<!text-slate-900 )(?<!text-slate-800 )(?<!text-slate-700 )(?<!text-slate-600 )(?<!border-slate-200 )(?<!border-slate-300 )\\b${darkClass}\\b`, 'g');
      content = content.replace(regex, combinedClasses);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
