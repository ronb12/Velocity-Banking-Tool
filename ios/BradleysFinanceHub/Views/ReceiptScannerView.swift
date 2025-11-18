//
//  ReceiptScannerView.swift
//  BradleysFinanceHub
//
//  Receipt scanning with OCR
//

import SwiftUI
import VisionKit
import Vision

struct ReceiptScannerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var scannedReceipts: [ScannedReceipt] = []
    @State private var showingScanner = false
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Scan Buttons
                    VStack(spacing: 12) {
                        Button(action: { showingScanner = true }) {
                            HStack {
                                Image(systemName: "camera.fill")
                                Text("Scan Receipt")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        Button(action: { showingImagePicker = true }) {
                            HStack {
                                Image(systemName: "photo.fill")
                                Text("Choose Photo")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                    .padding()
                    
                    // Scanned Receipts
                    if scannedReceipts.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "doc.text.viewfinder")
                                .font(.system(size: 50))
                                .foregroundColor(.secondary)
                            Text("No Scanned Receipts")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("Scan or upload a receipt to extract transaction details")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                    } else {
                        ForEach(scannedReceipts) { receipt in
                            ScannedReceiptCard(receipt: receipt)
                                .padding(.horizontal)
                        }
                    }
                }
            }
            .navigationTitle("Receipt Scanner")
            .sheet(isPresented: $showingScanner) {
                DocumentScannerView { result in
                    if case .success(let images) = result {
                        processScannedImages(images)
                    }
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $selectedImage)
            }
            .onChange(of: selectedImage) { oldValue, newValue in
                if let image = newValue {
                    processImage(image)
                }
            }
        }
    }
    
    private func processScannedImages(_ images: [UIImage]) {
        for image in images {
            processImage(image)
        }
    }
    
    private func processImage(_ image: UIImage) {
        // OCR processing
        guard let cgImage = image.cgImage else { return }
        
        let request = VNRecognizeTextRequest { request, error in
            guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
            
            var extractedText = ""
            for observation in observations {
                guard let topCandidate = observation.topCandidates(1).first else { continue }
                extractedText += topCandidate.string + "\n"
            }
            
            // Parse receipt data
            let receipt = parseReceiptText(extractedText, image: image)
            
            DispatchQueue.main.async {
                scannedReceipts.append(receipt)
            }
        }
        
        request.recognitionLevel = .accurate
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try? handler.perform([request])
    }
    
    private func parseReceiptText(_ text: String, image: UIImage) -> ScannedReceipt {
        // Simple parsing - in production, use ML models
        let lines = text.components(separatedBy: .newlines)
        var merchant = "Unknown"
        var total: Double = 0
        var date = Date()
        var items: [ReceiptItem] = []
        
        // Extract merchant name (usually first line or contains keywords)
        for line in lines.prefix(5) {
            if line.count > 3 && line.count < 50 {
                merchant = line.trimmingCharacters(in: .whitespaces)
                break
            }
        }
        
        // Extract total (look for "TOTAL", "AMOUNT", etc.)
        for line in lines {
            let upper = line.uppercased()
            if upper.contains("TOTAL") || upper.contains("AMOUNT") {
                let numbers = line.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                if let amount = Double(numbers) {
                    total = amount / 100 // Assuming cents
                }
            }
        }
        
        return ScannedReceipt(
            id: UUID().uuidString,
            merchant: merchant,
            total: total,
            date: date,
            items: items,
            image: image,
            rawText: text
        )
    }
}

struct ScannedReceipt: Identifiable {
    let id: String
    var merchant: String
    var total: Double
    var date: Date
    var items: [ReceiptItem]
    var image: UIImage?
    var rawText: String
}

struct ReceiptItem: Identifiable {
    let id: String
    var name: String
    var price: Double
    var quantity: Double
    
    init(id: String = UUID().uuidString, name: String, price: Double, quantity: Double = 1) {
        self.id = id
        self.name = name
        self.price = price
        self.quantity = quantity
    }
}

struct ScannedReceiptCard: View {
    let receipt: ScannedReceipt
    @State private var showingDetails = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                if let image = receipt.image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 80, height: 80)
                        .cornerRadius(8)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(receipt.merchant)
                        .font(.headline)
                    Text(receipt.date, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", receipt.total))")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                Button(action: { showingDetails = true }) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .sheet(isPresented: $showingDetails) {
            ReceiptDetailView(receipt: receipt)
        }
    }
}

struct ReceiptDetailView: View {
    let receipt: ScannedReceipt
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    @State private var category = ""
    @State private var showingSaveTransaction = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if let image = receipt.image {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .cornerRadius(12)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Merchant: \(receipt.merchant)")
                            .font(.headline)
                        Text("Date: \(receipt.date, style: .date)")
                            .font(.subheadline)
                        Text("Total: $\(String(format: "%.2f", receipt.total))")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    
                    Button(action: { showingSaveTransaction = true }) {
                        Text("Save as Transaction")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Receipt Details")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .sheet(isPresented: $showingSaveTransaction) {
                SaveReceiptTransactionView(receipt: receipt, dataService: dataService)
            }
        }
    }
}

struct SaveReceiptTransactionView: View {
    let receipt: ScannedReceipt
    let dataService: DataService
    @Environment(\.dismiss) var dismiss
    @State private var category = ""
    @State private var description = ""
    @State private var isSaving = false
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Description", text: $description)
                TextField("Category", text: $category)
            }
            .navigationTitle("Save Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveTransaction()
                    }
                    .disabled(isSaving || category.isEmpty)
                }
            }
        }
    }
    
    private func saveTransaction() {
        isSaving = true
        
        let transaction = Transaction(
            amount: receipt.total,
            category: category.isEmpty ? "Uncategorized" : category,
            date: receipt.date,
            description: description.isEmpty ? receipt.merchant : description,
            type: .expense
        )
        
        Task {
            do {
                try await dataService.saveTransaction(transaction)
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                }
            }
        }
    }
}

struct DocumentScannerView: UIViewControllerRepresentable {
    let completion: (Result<[UIImage], Error>) -> Void
    
    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }
    
    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(completion: completion)
    }
    
    class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let completion: (Result<[UIImage], Error>) -> Void
        
        init(completion: @escaping (Result<[UIImage], Error>) -> Void) {
            self.completion = completion
        }
        
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            var images: [UIImage] = []
            for pageIndex in 0..<scan.pageCount {
                images.append(scan.imageOfPage(at: pageIndex))
            }
            controller.dismiss(animated: true)
            completion(.success(images))
        }
        
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            controller.dismiss(animated: true)
            completion(.failure(error))
        }
        
        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            controller.dismiss(animated: true)
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(image: $image)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        @Binding var image: UIImage?
        
        init(image: Binding<UIImage?>) {
            _image = image
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            image = info[.originalImage] as? UIImage
            picker.dismiss(animated: true)
        }
    }
}

