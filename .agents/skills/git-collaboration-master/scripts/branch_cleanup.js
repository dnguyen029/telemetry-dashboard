const { execSync } = require('child_process');

function cleanupBranches() {
  console.log('🧹 (Node.js) Analyzing Git Repository for stale branches...');
  
  try {
    // Prune remote tracking branches
    execSync('git fetch --prune', { stdio: 'ignore' });
    
    // Find all remote branches merged into main
    const mergedOutput = execSync('git branch -r --merged main', { encoding: 'utf-8' });
    const mergedBranches = mergedOutput
      .split('\n')
      .map(b => b.trim())
      .filter(b => b && b !== 'origin/main' && b.startsWith('origin/'));
      
    if (mergedBranches.length === 0) {
      console.log('✨ Clean! No merged branches found to delete.');
      return;
    }

    console.log(`🔍 Checking merged branches... FOUND: ${mergedBranches.length}`);
    mergedBranches.forEach(b => console.log(`   - ${b}`));

    console.log('\n🚀 Starting automated cleanup...');
    let deletedCount = 0;
    
    for (const branch of mergedBranches) {
      const branchName = branch.replace('origin/', '');
      try {
        console.log(`Deleting remote branch: ${branchName}`);
        execSync(`git push origin --delete ${branchName}`, { stdio: 'ignore' });
        deletedCount++;
      } catch (err) {
        console.log(`⚠️ Failed to delete ${branchName} on remote. It may already be deleted.`);
      }
      
      // Also attempt to delete locally if it exists
      try {
        execSync(`git branch -d ${branchName}`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore if local branch doesn't exist or isn't fully merged locally
      }
    }
    
    console.log(`\n✨ Summary: ${deletedCount} branches successfully pruned.`);
  } catch (err) {
    console.error(`❌ Error during cleanup: ${err.message}`);
  }
}

cleanupBranches();
