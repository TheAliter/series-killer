// Test script to show Open Library API responses for specific books
const testOpenLibraryBooks = async () => {
  const books = [
    { title: "The Final Empire", author: "Brandon Sanderson" },
    { title: "Scythe", author: "Neal Shusterman" }
  ];

  for (const book of books) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SEARCHING FOR: "${book.title}" by ${book.author}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Search for the book
      const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
      const searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&fields=key,title,author_name,cover_i,first_publish_year,series,series_key,series_number,edition_count,has_fulltext,ia,ebook_count_i&limit=5`;
      
      console.log(`\nSearch URL: ${searchUrl}`);
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      console.log(`\n📊 SEARCH RESULTS:`);
      console.log(`Total found: ${searchData.numFound} books`);
      console.log(`Showing: ${searchData.docs.length} results`);
      
      if (searchData.docs && searchData.docs.length > 0) {
        // Show the first (most relevant) result
        const firstBook = searchData.docs[0];
        
        console.log(`\n🏆 TOP RESULT:`);
        console.log(JSON.stringify(firstBook, null, 2));
        
        // Get detailed information about this specific book
        console.log(`\n🔍 GETTING DETAILED INFORMATION...`);
        const detailResponse = await fetch(`https://openlibrary.org${firstBook.key}.json`);
        
        if (detailResponse.ok) {
          const bookDetail = await detailResponse.json();
          
          console.log(`\n📖 DETAILED BOOK INFORMATION:`);
          console.log(JSON.stringify(bookDetail, null, 2));
          
          // If there are works, get work information
          if (bookDetail.works && bookDetail.works.length > 0) {
            const workKey = bookDetail.works[0].key;
            console.log(`\n🔗 GETTING WORK INFORMATION: ${workKey}`);
            
            const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
            if (workResponse.ok) {
              const workDetail = await workResponse.json();
              
              console.log(`\n📚 WORK INFORMATION:`);
              console.log(JSON.stringify(workDetail, null, 2));
            }
          }
        } else {
          console.log(`❌ Failed to get detailed information: ${detailResponse.status}`);
        }
      } else {
        console.log(`❌ No books found for "${book.title}"`);
      }
      
    } catch (error) {
      console.error(`❌ Error searching for "${book.title}":`, error);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Run the test
console.log('🚀 Testing Open Library API for specific books...\n');
testOpenLibraryBooks(); 